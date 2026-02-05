# Butler Agent

A butler agent that connects to **Outlook** and **Gmail** to produce a daily inbox digest, highlights attention/actions needed, and creates a daily task with follow-up sub-tasks in **Microsoft ToDo**.

## Requirements

- **Microsoft**: App-only auth (no user login, no MFA).
- **Google**: OAuth (sign in + MFA once, then refresh token).
- **Microsoft ToDo**: One daily task with checklist sub-tasks.

## Setup

```bash
cd agents/butler
pnpm install
cp .env.example .env
# Edit .env with your credentials (see docs/SETUP.md)
pnpm build
```

**Credentials and avoiding MFA:** See **[docs/SETUP.md](docs/SETUP.md)** for:

- Where to configure Microsoft (Azure AD app, no MFA) and Gmail (OAuth, MFA once).
- How to get a Google refresh token once: `pnpm build && node --env-file=.env dist/scripts/auth-google.js`.

## Scripts

- `pnpm build` — Compile TypeScript.
- `pnpm start` — Run the butler agent (skips providers whose credentials are missing).
- `pnpm auth:google` — One-time OAuth to save Gmail refresh token (run after `pnpm build`; set env first).
- `pnpm lint` — Run ESLint.
- `pnpm test` — Run unit tests.
- `pnpm test:e2e` — Run end-to-end tests (requires Azure OpenAI and provider credentials).

## How to run / test

- **Full run:** Set Microsoft, Google, and Azure OpenAI in `.env`, then `pnpm start`.
- **Outlook only:** Set `AZURE_*` and `AZURE_OPENAI_*` in `.env`; leave `GOOGLE_*` empty. `pnpm start` will skip Gmail.
- **Gmail only:** Set `GOOGLE_*` and `AZURE_OPENAI_*`; leave `AZURE_CLIENT_ID` (etc.) empty. `pnpm start` will skip Outlook.
- **Unit tests (no credentials):** `pnpm test`.
- **E2E ToDo test:** `pnpm test:e2e` — creates a real task in list "Butler E2E Test", verifies it, then deletes it. Requires Microsoft auth in `.env`; otherwise the ToDo e2e test is skipped.

## Environment Variables

See [.env.example](.env.example). Do not commit `.env`.

## Development

- TypeScript, pnpm, ESLint 9.
- Unit tests and e2e tests (e2e uses Azure OpenAI).
- Commit often with descriptive messages.

## License

See repository root.
