/**
 * One-time Google OAuth flow: open browser, sign in (MFA once), save refresh token.
 * Run: node --env-file=.env dist/scripts/auth-google.js  (Node 20+)
 *   or: export $(grep -v '^#' .env | xargs) && node dist/scripts/auth-google.js
 */
import { google } from "googleapis";
import * as http from "node:http";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { exec } from "node:child_process";

const SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"];
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI ?? "http://localhost:3000/oauth/callback";
const TOKEN_PATH = process.env.GOOGLE_TOKEN_PATH ?? ".cache/google-tokens.json";

function getEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Set ${name} in .env (or run with node --env-file=.env)`);
  return v;
}

async function main() {
  const clientId = getEnv("GOOGLE_CLIENT_ID");
  const clientSecret = getEnv("GOOGLE_CLIENT_SECRET");

  const oauth2 = new google.auth.OAuth2(clientId, clientSecret, REDIRECT_URI);
  const authUrl = oauth2.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
  });

  const code = await new Promise<string>((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      const url = new URL(req.url ?? "/", `http://${req.headers.host}`);
      if (url.pathname !== new URL(REDIRECT_URI).pathname) {
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
    const port = new URL(REDIRECT_URI).port || "3000";
    server.listen(Number(port), () => {
      console.log(`Open this URL in your browser (sign in and complete MFA once):\n${authUrl}\n`);
      const cmd =
        process.platform === "win32"
          ? `start "" "${authUrl}"`
          : process.platform === "darwin"
            ? `open "${authUrl}"`
            : `xdg-open "${authUrl}"`;
      exec(cmd);
    });
  });

  const { tokens } = await oauth2.getToken(code);
  const dir = path.dirname(TOKEN_PATH);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(TOKEN_PATH, JSON.stringify(tokens, null, 2));
  console.log(`Tokens saved to ${TOKEN_PATH}. You can run the butler with Gmail now.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
