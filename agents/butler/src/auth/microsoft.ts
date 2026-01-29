/**
 * Microsoft authentication (MSAL) for Graph API and ToDo.
 * No username/password: OAuth / client credentials or device code.
 */
import {
  ConfidentialClientApplication,
  type Configuration as MsalConfig,
} from "@azure/msal-node";
import type { ClientCredentialRequest } from "@azure/msal-node";
import * as fs from "node:fs/promises";
import * as path from "node:path";

const SCOPES = [
  "https://graph.microsoft.com/.default",
  "offline_access",
];

export interface MicrosoftAuthConfig {
  clientId: string;
  tenantId: string;
  clientSecret: string;
  tokenCachePath: string;
}

let cachedApp: ConfidentialClientApplication | null = null;

function getMsalConfig(cfg: MicrosoftAuthConfig): MsalConfig {
  return {
    auth: {
      clientId: cfg.clientId,
      authority: `https://login.microsoftonline.com/${cfg.tenantId}`,
      clientSecret: cfg.clientSecret,
    },
    // MSAL Node v2 uses cachePlugin only; omit for in-memory cache (client credentials)
  };
}

export function getConfidentialClient(cfg: MicrosoftAuthConfig): ConfidentialClientApplication {
  if (!cachedApp) {
    cachedApp = new ConfidentialClientApplication(getMsalConfig(cfg));
  }
  return cachedApp;
}

/**
 * Acquire token for Graph (and ToDo) using client credentials.
 * For user-delegated flows (e.g. device code) you would use a different method.
 */
export async function acquireTokenForGraph(
  cfg: MicrosoftAuthConfig
): Promise<string> {
  const app = getConfidentialClient(cfg);
  const request: ClientCredentialRequest = {
    scopes: SCOPES,
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
