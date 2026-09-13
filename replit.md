# Pahadi Bwari

Pahadi Bwari is a privacy-first matrimonial platform for adults from the Uttarakhand community.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server
- `pnpm --filter @workspace/pahadi-bwari run dev` — run the web app
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Authentication and upload configuration is managed through Replit-provisioned Clerk and App Storage secrets.

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/pahadi-bwari/` — React/Vite member and public web app.
- `artifacts/api-server/src/routes/matrimonial.ts` — authenticated profile, discovery, interests, reports, moderation, and photo metadata routes.
- `artifacts/api-server/src/routes/storage.ts` — authenticated object-storage upload URL and private object access routes.
- `lib/api-spec/openapi.yaml` — source-of-truth API contract.
- `lib/api-client-react/src/generated/` and `lib/api-zod/src/generated/` — generated React Query hooks and request/response validators.
- `lib/db/src/schema/matrimonial.ts` — relational PostgreSQL/Drizzle schema for accounts, profiles, preferences, photos, interests, and reports.
- `artifacts/pahadi-bwari/src/index.css` — visual tokens and responsive theme.

## Architecture decisions

- Clerk is the authentication boundary; the API trusts Clerk session identity and never accepts client-provided user IDs.
- Profile visibility and privacy filtering are enforced on the server, not only in the UI.
- Photos use Replit App Storage presigned uploads; only validated metadata is persisted in PostgreSQL.
- OpenAPI is the contract source of truth, with generated Zod validators and React Query hooks.
- Public pages intentionally exclude contact details, private family information, and exact address data.

## Product

- Public landing, approach, how-it-works, safety, contact, privacy, terms, and not-found pages.
- Clerk-branded sign-in and sign-up flows at `/sign-in/*` and `/sign-up/*`.
- Protected dashboard with profile completion, visibility, interests, discovery, filters, pagination, profile pages, profile editing, privacy settings, and photo management.
- Express Interest with incoming accept/decline states and reporting.
- Server-authorized admin moderation overview for reports and community statistics.

## User preferences

No standing user preferences have been recorded.

## Gotchas

- Run OpenAPI code generation after changing `lib/api-spec/openapi.yaml`.
- A newly authenticated Clerk member may not have a profile yet; the dashboard and editor must preserve that onboarding path.
- Photo uploads are restricted to JPG/JPEG/PNG and 5 MB in both the UI and server-side upload metadata flow.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
