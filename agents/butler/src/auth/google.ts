/**
 * Google OAuth for Gmail API.
 * Uses stored refresh token; initial auth must be done once (e.g. local OAuth callback).
 */
import { google } from "googleapis";
import * as fs from "node:fs/promises";
import * as path from "node:path";

export interface GoogleAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  tokenPath: string;
}

let cachedOAuth2Client: InstanceType<typeof google.auth.OAuth2> | null = null;

export function getOAuth2Client(cfg: GoogleAuthConfig): InstanceType<typeof google.auth.OAuth2> {
  if (!cachedOAuth2Client) {
    cachedOAuth2Client = new google.auth.OAuth2(
      cfg.clientId,
      cfg.clientSecret,
      cfg.redirectUri
    );
  }
  return cachedOAuth2Client;
}

export async function loadTokens(cfg: GoogleAuthConfig): Promise<void> {
  const client = getOAuth2Client(cfg);
  try {
    const raw = await fs.readFile(cfg.tokenPath, "utf-8");
    const tokens = JSON.parse(raw) as { refresh_token?: string; access_token?: string; expiry_date?: number };
    client.setCredentials(tokens);
  } catch (e) {
    throw new Error(
      `Failed to load Google tokens from ${cfg.tokenPath}. Run OAuth flow once to obtain refresh_token.`
    );
  }
}

export async function saveTokens(
  cfg: GoogleAuthConfig,
  tokens: { refresh_token?: string; access_token?: string; expiry_date?: number }
): Promise<void> {
  const dir = path.dirname(cfg.tokenPath);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(cfg.tokenPath, JSON.stringify(tokens, null, 2));
}

export async function getValidAccessToken(cfg: GoogleAuthConfig): Promise<string> {
  const client = getOAuth2Client(cfg);
  await client.getAccessToken();
  const token = client.credentials.access_token;
  if (token) return token;
  throw new Error("Google OAuth: no valid access token");
}
