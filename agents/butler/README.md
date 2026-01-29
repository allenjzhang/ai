# Butler Agent

A butler agent that connects to **Outlook** and **Gmail** to produce a daily inbox digest, highlights attention/actions needed, and creates a daily task with follow-up sub-tasks in **Microsoft ToDo**.

## Requirements

- **Microsoft**: Login via OAuth (no username/password).
- **Google**: Gmail via OAuth.
- **Microsoft ToDo**: One daily task with a list of sub follow-up tasks.

## Setup

```bash
pnpm install
cp .env.example .env
# Edit .env with your credentials (see below)
pnpm build
```

## Scripts

- `pnpm build` — Compile TypeScript.
- `pnpm start` — Run the butler agent.
- `pnpm lint` — Run ESLint.
- `pnpm test` — Run unit tests.
- `pnpm test:e2e` — Run end-to-end tests (requires Azure OpenAI and provider credentials).

## Environment Variables

See [.env.example](.env.example) for required variables. Do not commit `.env`.

## Development

- TypeScript, pnpm, ESLint 9.
- Unit tests and e2e tests (e2e uses Azure OpenAI).
- Commit often with descriptive messages.

## License

See repository root.
