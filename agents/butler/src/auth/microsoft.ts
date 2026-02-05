/**
 * Microsoft authentication (MSAL) for Graph API and ToDo.
 * Supports: (1) delegated OAuth (personal @live.com – token file with refresh_token),
 *           (2) client credentials (work/school – no user sign-in).
 */
import {
  ConfidentialClientApplication,
  type Configuration as MsalConfig,
} from "@azure/msal-node";
import type { ClientCredentialRequest } from "@azure/msal-node";
import * as fs from "node:fs/promises";
import * as path from "node:path";

const CLIENT_CREDENTIAL_SCOPES = [
  "https://graph.microsoft.com/.default",
  "offline_access",
];

export interface MicrosoftAuthConfig {
  clientId: string;
  tenantId: string;
  clientSecret: string;
  tokenCachePath: string;
}

interface MicrosoftTokenFile {
  access_token: string;
  expires_on: number;
  refresh_token?: string;
}

const TOKEN_EXPIRY_BUFFER_SEC = 60;

let cachedApp: ConfidentialClientApplication | null = null;

function getMsalConfig(cfg: MicrosoftAuthConfig): MsalConfig {
  return {
    auth: {
      clientId: cfg.clientId,
      authority: `https://login.microsoftonline.com/${cfg.tenantId}`,
      clientSecret: cfg.clientSecret,
    },
  };
}

export function getConfidentialClient(cfg: MicrosoftAuthConfig): ConfidentialClientApplication {
  if (!cachedApp) {
    cachedApp = new ConfidentialClientApplication(getMsalConfig(cfg));
  }
  return cachedApp;
}

async function readTokenFile(tokenPath: string): Promise<MicrosoftTokenFile | null> {
  try {
    const raw = await fs.readFile(tokenPath, "utf-8");
    const data = JSON.parse(raw) as MicrosoftTokenFile;
    if (data.access_token && typeof data.expires_on === "number") return data;
  } catch {
    // file missing or invalid
  }
  return null;
}

async function refreshDelegatedToken(cfg: MicrosoftAuthConfig): Promise<string> {
  const tokenPath = cfg.tokenCachePath;
  const data = await readTokenFile(tokenPath);
  if (!data?.refresh_token) {
    throw new Error(
      `No refresh token at ${tokenPath}. Run: pnpm run auth:microsoft (once) for personal @live.com.`
    );
  }

  const now = Math.floor(Date.now() / 1000);
  if (data.access_token && data.expires_on > now + TOKEN_EXPIRY_BUFFER_SEC) {
    return data.access_token;
  }

  const tokenUrl = `https://login.microsoftonline.com/${cfg.tenantId}/oauth2/v2.0/token`;
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: cfg.clientId,
    client_secret: cfg.clientSecret,
    refresh_token: data.refresh_token,
  });

  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Microsoft token refresh failed: ${res.status} ${text}`);
  }

  const result = (await res.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
  };

  if (!result.access_token) {
    throw new Error("No access_token in refresh response");
  }

  const expiresOn =
    Math.floor(Date.now() / 1000) + (result.expires_in ?? 3600);
  const updated: MicrosoftTokenFile = {
    access_token: result.access_token,
    expires_on: expiresOn,
  };
  if (result.refresh_token) {
    updated.refresh_token = result.refresh_token;
  } else if (data.refresh_token) {
    updated.refresh_token = data.refresh_token;
  }

  await fs.mkdir(path.dirname(tokenPath), { recursive: true });
  await fs.writeFile(tokenPath, JSON.stringify(updated, null, 2));

  return result.access_token;
}

/**
 * Acquire token for Graph (and ToDo).
 * Uses delegated token file (personal @live.com) if present; otherwise client credentials (work/school).
 */
export async function acquireTokenForGraph(
  cfg: MicrosoftAuthConfig
): Promise<string> {
  const data = await readTokenFile(cfg.tokenCachePath);
  if (data?.refresh_token) {
    return refreshDelegatedToken(cfg);
  }

  const app = getConfidentialClient(cfg);
  const request: ClientCredentialRequest = {
    scopes: CLIENT_CREDENTIAL_SCOPES,
  };
  const result = await app.acquireTokenByClientCredential(request);
  if (!result?.accessToken) {
    throw new Error("Failed to acquire Microsoft access token");
  }
  return result.accessToken;
}

/**
 * Ensure cache directory exists.
 */
export async function ensureCacheDir(cachePath: string): Promise<void> {
  const dir = path.dirname(cachePath);
  await fs.mkdir(dir, { recursive: true });
}
