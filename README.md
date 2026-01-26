# Promptify

## Setup

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables:

```bash
cp .env.example .env
```

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

3. Run locally:

```bash
npm run dev
```

## Database

Apply `supabase_schema.sql` to your Supabase project.

Notes:
- Prompt text is stored in `prompt_secrets` and protected by RLS.
- Unlocks and rating updates are handled by RPC functions: `unlock_prompt` and `update_prompt_rating`.

## Scripts

- `npm run build` – production build
- `npm run preview` – preview build
- `npm run lint` – lint
- `npm run test` – unit/integration tests
- `npm run test:e2e` – Playwright e2e tests (run `npx playwright install` first)
- `npm run typecheck` – TypeScript typecheck
