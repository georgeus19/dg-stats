# DG Stats

Disc-golf round and tournament analytics. The app keeps provider payloads and
normalized facts separate, so long-term statistics remain correct even when a
provider changes a metric definition or a layout changes.

## Stack

- Next.js + React + TypeScript for the dashboard and browser-facing API.
- Neon Postgres + Drizzle for canonical data and migrations.
- Neon Function Trigger for short, idempotent import batches.
- Vercel for Git-connected preview and production deployments.

## Local setup

1. Copy `.env.example` to `.env.local` and set a Neon `DATABASE_URL`.
2. Install dependencies: `pnpm install`.
3. Apply the initial schema: `pnpm db:migrate`.
4. Start the dashboard: `pnpm dev`.

Useful checks:

```bash
pnpm validate
pnpm build
```

## Deployment

1. Create a Neon project and run `pnpm db:migrate` with its pooled connection
   string.
2. Link the repository to Vercel. Set `DATABASE_URL` as an encrypted production
   environment variable. Vercel deploys every push and creates previews for
   pull requests.
3. Install the Neon CLI, run `neon link`, then run `pnpm neon:deploy`. The
   tracked `neon.ts` deploys the worker and its 15-minute schedule.

`neon.ts` is infrastructure-as-code. It deliberately contains no provider
credentials. Configure a provider adapter only after its permitted access and
retention terms are known.

## Importer policy

The project has an import-job queue but no active external importer. Do not add
an undocumented UDisc integration. Keep PDGA ingestion behind the adapter
boundary and enable it only under the appropriate developer/partner agreement.

## Data model

`round`, `hole_score`, `throw`, and `stat_observation` are canonical facts.
`stat_observation` always stores counts and opportunities, rather than only a
percentage. `import_batch` preserves provenance and idempotency; it may hold a
raw provider payload only where that retention is permitted.
