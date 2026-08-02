# Couch Potato — project notes

## Verification commands

```bash
npx prisma generate      # required after touching prisma/schema.prisma
npx tsc --noEmit         # typecheck
npx next build           # full build; lint + type errors FAIL the build (by design)
npx next start -p 3000   # smoke-test the production build
```

`next.config.ts` deliberately sets `eslint.ignoreDuringBuilds: false` and
`typescript.ignoreBuildErrors: false`. Do not re-enable those flags — they
previously hid real Next 15 breakages (sync access to async `params`).

## Environment variables

Server-only (never expose to the browser):

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Neon Postgres connection string |
| `TMDB_API_READ_ACCESS_TOKEN` | Preferred TMDB credential (bearer token) |
| `TMDB_API_KEY` | Fallback TMDB credential (v3 key) |

Public (safe to ship to the browser):

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (RLS-protected by design) |
| `NEXT_PUBLIC_APP_URL` | Canonical origin; used for metadata + origin allowlist |

`NEXT_PUBLIC_TMDB_API_KEY` is **removed**. A `NEXT_PUBLIC_` prefix inlines the
value into the client bundle, which published the TMDB key to every visitor.

## Architecture rules

### TMDB access

- All TMDB calls go through `fetchFromTMDB()` in `lib/tmdb/fetcher.ts`.
- On the server it calls TMDB directly with the credential.
- In the browser it calls `/api/tmdb`, a proxy that enforces an endpoint
  allowlist (`ALLOWED_TMDB_PATHS`), a query-param allowlist
  (`ALLOWED_TMDB_PARAMS`) and a per-IP rate limit.
- Never call `api.themoviedb.org` directly from a component or hook, and never
  read a TMDB credential outside `lib/tmdb/fetcher.ts`.

### API route conventions

Every route under `app/api/` (except `/api/tmdb`) must:

1. Reject cross-origin mutations — `isSameOrigin(request)`.
2. Authenticate via `getCurrentUser(extractBearerToken(request))`, which
   verifies the JWT with Supabase and upserts the mirrored Postgres row.
3. Rate-limit per user — `rateLimit(key, { limit, windowMs })`.
4. Validate every input with a Zod schema from `lib/api/validation.ts`.
   Never pass a raw request body into Prisma.
5. Scope all queries by `userId: user.id` so users cannot touch others' rows.
6. Return errors via `serverErrorResponse()` — it logs detail server-side and
   returns an opaque message, so internal errors are never leaked to clients.

Helpers live in `lib/api/guards.ts`. The rate limiter is in-memory and therefore
per-instance; move it to Redis/Upstash if you need hard guarantees.

### Auth

- `middleware.ts` calls `supabase.auth.getUser()` on **every** matched request.
  This is what refreshes expiring tokens; skipping it logs users out at random.
- `/api/tmdb` is excluded from the middleware matcher so it stays CDN-cacheable.
- Post-login redirects must pass through `safeRedirect()` in `hooks/useAuth.ts`
  to prevent open redirects.
