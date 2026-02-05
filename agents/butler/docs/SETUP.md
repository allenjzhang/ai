# Butler Agent – Credentials & Running

## Where to configure credentials

All credentials are read from **environment variables**. Use a `.env` file in `agents/butler/` (do not commit it).

1. Copy the example file:
   ```bash
   cd agents/butler
   cp .env.example .env
   ```
2. Edit `.env` and fill in the values below.

---

## Microsoft Outlook (and ToDo)

### Work or school account (no MFA)

The butler can use **Azure AD application (client) credentials**: the app calls Microsoft Graph as itself, **no user sign-in**, so **no MFA**. This works only for **work or school** (organizational) accounts, **not** for personal @live.com / @outlook.com.

**Steps (work/school only):**

1. **Azure portal** → [App registrations](https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade) → **New registration**.
   - Name: e.g. `Butler Agent`.
   - Supported account types: **Accounts in this organizational directory only** (single tenant) or **Multitenant**.
   - Redirect URI: leave empty.
   - Register.

2. **Certificates & secrets** → **New client secret** → copy the **Value** → `AZURE_CLIENT_SECRET`.

3. **API permissions** → **Add a permission** → **Microsoft Graph** → **Application permissions**:
   - `Mail.Read`, `Tasks.ReadWrite`.
   - **Grant admin consent** for your org.

4. **Overview** → copy **Application (client) ID** → `AZURE_CLIENT_ID`, **Directory (tenant) ID** → `AZURE_TENANT_ID`.

5. In `.env`: `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_CLIENT_SECRET`.

---

### Personal Microsoft account (@live.com, @outlook.com)

Personal accounts (**@live.com**, **@outlook.com**, **@hotmail.com**) **cannot** use app-only (client credentials). Microsoft only allows that for work/school tenants. For personal accounts you must use **delegated** permissions and **sign in once** (OAuth), similar to Gmail.

**How to get credentials for @live.com:**

1. **Azure portal** → [App registrations](https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade) → **New registration**.
   - **Name:** e.g. `Butler Agent (Personal)`.
   - **Supported account types:** choose one of:
     - **Personal Microsoft accounts only**, or
     - **Accounts in any organizational directory and personal Microsoft accounts** (work/school + personal).
   - **Redirect URI:** **Web** → `http://localhost:3000/oauth/callback` (needed for “sign in once” OAuth).
   - Click **Register**.

2. **Certificates & secrets** → **New client secret** → copy the **Value** once → this is `AZURE_CLIENT_SECRET`.

3. **API permissions** → **Add a permission** → **Microsoft Graph** → **Delegated permissions** (not Application):
   - `Mail.Read` – read your mail.
   - `Tasks.ReadWrite` – read/write your To Do.
   - No admin consent; you consent when you sign in.

4. **Overview** → copy:
   - **Application (client) ID** → `AZURE_CLIENT_ID`
   - **Directory (tenant) ID** → `AZURE_TENANT_ID`  
   (For “Personal Microsoft accounts only”, tenant is often `common` or your app’s tenant.)

5. In `.env`:
   ```env
   AZURE_CLIENT_ID=<application-client-id>
   AZURE_TENANT_ID=common
   AZURE_CLIENT_SECRET=<client-secret-value>
   AZURE_REDIRECT_URI=http://localhost:3000/oauth/callback
   ```
   Use `AZURE_TENANT_ID=common` for **Personal Microsoft accounts only** so any personal account can sign in. Optional: `MSAL_TOKEN_CACHE_PATH=.cache/msal-tokens.json` (default).

6. **Sign in once (OAuth):**  
   After building, run the one-time auth script (opens browser; sign in with your @live.com and complete MFA once):
   ```bash
   pnpm build
   pnpm run auth:microsoft
   ```
   Tokens are saved to `.cache/msal-tokens.json`. The butler will use the refresh token on later runs and will **not** ask for MFA again.

**Summary for @live.com:** Register the app with “Personal Microsoft accounts”, add **delegated** Mail.Read and Tasks.ReadWrite, set redirect URI and client secret, put Client ID, tenant `common`, and secret in `.env`. Run `pnpm run auth:microsoft` once to save a refresh token; then run the butler as usual.

---

## Gmail – OAuth (MFA only once)

The butler uses **OAuth 2.0** with a stored **refresh token**. You sign in (and complete MFA) **once**; after that the app uses the refresh token and does **not** prompt again.

### Steps

1. **Google Cloud Console** → [APIs & Services → Credentials](https://console.cloud.google.com/apis/credentials).
2. **Create project** (or select one) → **OAuth consent screen**:
   - User type: **External** (or Internal for Workspace).
   - Add scopes: `https://www.googleapis.com/auth/gmail.readonly` (and optionally `gmail.modify` if you add write later).
3. **Credentials** → **Create credentials** → **OAuth client ID**:
   - Application type: **Desktop app** (or **Web application** if you use a redirect URL).
   - If Web application: add **Authorized redirect URI** `http://localhost:3000/oauth/callback` (must match `.env`).
   - Copy **Client ID** and **Client secret**.
4. In `.env`:
   ```env
   GOOGLE_CLIENT_ID=<client-id>
   GOOGLE_CLIENT_SECRET=<client-secret>
   GOOGLE_REDIRECT_URI=http://localhost:3000/oauth/callback
   ```
5. **Get a refresh token once** (this is the only time you sign in and may see MFA):
   - Run the OAuth helper (see below), or
   - Use any OAuth 2.0 “get refresh token” script that uses your client ID/secret and redirect URI, then save the refresh token into the file used by the butler (default: `.cache/google-tokens.json`).

After the refresh token is saved, normal runs use it and do **not** ask for MFA.

---

## Azure OpenAI (for summarization)

Required for the daily digest and for e2e tests.

1. Create an **Azure OpenAI** resource and deploy a model (e.g. `gpt-4o`).
2. In Azure portal: **Keys and Endpoint** → copy endpoint and key.
3. In `.env`:
   ```env
   AZURE_OPENAI_ENDPOINT=https://<your-resource>.openai.azure.com
   AZURE_OPENAI_API_KEY=<key>
   AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o
   ```

---

## How to run

### Full run (all providers)

```bash
cd agents/butler
pnpm install
pnpm build
pnpm start
```

Requires `.env` with Microsoft, Google, and Azure OpenAI set. The butler will:

- Fetch mail from Outlook and Gmail (last 24h),
- Summarize with Azure OpenAI,
- Create a daily To Do task with checklist items.

### Test with only some providers

You can skip providers so you can test with the credentials you have:

- **Only Microsoft (Outlook + ToDo)**  
  Set Microsoft and Azure OpenAI in `.env`. Then run with Gmail skipped (see “Optional: skip providers” below).

- **Only Gmail**  
  Set Google and Azure OpenAI, run with Outlook skipped.

- **Dry run (no To Do, no real APIs)**  
  Use unit tests: `pnpm test`.

### Optional: skip providers via env

The app does not support CLI flags today. To test “Outlook only” or “Gmail only”, you can temporarily make the orchestrator skip one provider (e.g. set `skipGmail: true` in `src/orchestrator.ts` or add a `SKIP_GMAIL=1` / `SKIP_OUTLOOK=1` check in code and read it in the orchestrator). A simple way is to **omit** the credentials you want to skip: if we add a small guard (e.g. “if no GOOGLE_CLIENT_ID, skip Gmail”), then leaving `GOOGLE_*` empty would skip Gmail. I can add that next if you want.

---

## Getting a Google refresh token (one-time)

The butler expects a JSON file (default: `.cache/google-tokens.json`) with at least `refresh_token` (and optionally `access_token`, `expiry_date`). You can generate it once with a small script.

1. **Option A – Node script**  
   In `agents/butler`, install `googleapis` (already a dependency). Run a one-off script that:
   - Uses your `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`.
   - Starts a short-lived HTTP server on the redirect port (e.g. 3000), opens the browser to Google’s consent URL, and after you sign in (and complete MFA once) captures the redirect and exchanges the code for tokens.
   - Writes `{ refresh_token, access_token, expiry_date }` to `.cache/google-tokens.json`.

2. **Option B – OAuth Playground**  
   Use [Google OAuth 2.0 Playground](https://developers.google.com/oauthplayground/) with your client ID/secret (if allowed) or with a temporary client, get a refresh token, then save the token set into `.cache/google-tokens.json` in the format the butler expects.

**Built-in script:** From `agents/butler` after `pnpm build`, run (with env loaded):

```bash
# Node 20+: load .env automatically
node --env-file=.env dist/scripts/auth-google.js

# Or: load .env into shell then run
export $(grep -v '^#' .env | xargs)
node dist/scripts/auth-google.js
```

Or use the npm script (env must already be set):

```bash
pnpm build
node --env-file=.env pnpm run auth:google
```

A browser window opens; sign in (and complete MFA once). The script saves tokens to `.cache/google-tokens.json`. After that, the butler uses the refresh token and does not prompt again.
