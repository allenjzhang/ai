/**
 * One-time Microsoft OAuth (auth code) for personal @live.com / @outlook.com.
 * Opens browser, you sign in once (MFA once), saves refresh token for the butler.
 * Run: node --env-file=.env dist/scripts/auth-microsoft.js
 */
import { ConfidentialClientApplication } from "@azure/msal-node";
import * as http from "node:http";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { exec } from "node:child_process";

const SCOPES = [
  "https://graph.microsoft.com/Mail.Read",
  "https://graph.microsoft.com/Tasks.ReadWrite",
  "offline_access",
];

function getEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Set ${name} in .env (or run with node --env-file=.env)`);
  return v;
}

async function main() {
  const clientId = getEnv("AZURE_CLIENT_ID");
  const clientSecret = getEnv("AZURE_CLIENT_SECRET");
  const tenantId = process.env.AZURE_TENANT_ID ?? "common";
  const redirectUri = process.env.AZURE_REDIRECT_URI ?? "http://localhost:3000/oauth/callback";
  const tokenPath = process.env.MSAL_TOKEN_CACHE_PATH ?? ".cache/msal-tokens.json";

  const app = new ConfidentialClientApplication({
    auth: {
      clientId,
      authority: `https://login.microsoftonline.com/${tenantId}`,
      clientSecret,
    },
  });

  const authUrl = await app.getAuthCodeUrl({
    scopes: SCOPES,
    redirectUri,
    prompt: "consent",
  });

  const code = await new Promise<string>((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      const url = new URL(req.url ?? "/", `http://${req.headers.host}`);
      const callbackPath = new URL(redirectUri).pathname;
      if (url.pathname !== callbackPath) {
        res.writeHead(404).end();
        return;
      }
      const code = url.searchParams.get("code");
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(
        "<p>Authorization complete. You can close this tab and return to the terminal.</p>"
      );
      server.close();
      if (code) resolve(code);
      else reject(new Error("No code in callback"));
    });
    const port = new URL(redirectUri).port || "3000";
    server.listen(Number(port), () => {
      console.log(
        `Open this URL in your browser (sign in with your @live.com and complete MFA once):\n${authUrl}\n`
      );
      const cmd =
        process.platform === "win32"
          ? `start "" "${authUrl}"`
          : process.platform === "darwin"
            ? `open "${authUrl}"`
            : `xdg-open "${authUrl}"`;
      exec(cmd);
    });
  });

  const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
  });

  const tokenRes = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!tokenRes.ok) {
    const text = await tokenRes.text();
    throw new Error(`Token exchange failed: ${tokenRes.status} ${text}`);
  }

  const data = (await tokenRes.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
  };

  if (!data.access_token) {
    throw new Error("No access_token in token response");
  }

  const expiresOn =
    Math.floor(Date.now() / 1000) + (data.expires_in ?? 3600);

  const tokenPayload: MicrosoftTokenFile = {
    access_token: data.access_token,
    expires_on: expiresOn,
  };
  if (data.refresh_token) {
    tokenPayload.refresh_token = data.refresh_token;
  }

  const dir = path.dirname(tokenPath);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(tokenPath, JSON.stringify(tokenPayload, null, 2));

  if (!tokenPayload.refresh_token) {
    console.warn(
      "No refresh_token in response. Ensure offline_access scope and consent. You may need to re-run auth when the access token expires."
    );
  }
  console.log(`Tokens saved to ${tokenPath}. You can run the butler with Outlook/ToDo now.`);
}

interface MicrosoftTokenFile {
  access_token: string;
  expires_on: number;
  refresh_token?: string;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
