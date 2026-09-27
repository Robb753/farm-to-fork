# C2 — Preview / staging isolation

Closure date: 2026-09-27. **C2 COMPLETE**, subject to the evidence attribution below.
Scope: environment isolation only. No C3 work, production deployment or business fix.

## Architecture finale

| Environment | Frontend | Supabase | Auth | Evidence |
|---|---|---|---|---|
| LOCAL | http://localhost:3000 | Docker API 127.0.0.1:54321 / DB 54322 | Clerk Development | User C1 Windows/Docker acceptance; C1 files unchanged |
| PREVIEW | Vercel branch deployment below | eistpzpsdsbpvorgqxke | Clerk Development | User manual C2 deployment/browser evidence |
| PRODUCTION | https://www.farm2fork.fr | reukdkgdlvgdvyuwuaub | Existing configuration, Development issuer previously observed | Previous read-only inventory; unchanged by this closure |

Staging URL: https://eistpzpsdsbpvorgqxke.supabase.co
Production URL: https://reukdkgdlvgdvyuwuaub.supabase.co
Organization: `Robb753's Org` / `bjhqmwblqqvwmjstivar`; staging region `eu-central-1`.
The user reports a dedicated staging project with no production data copied.

## Git and Vercel Preview

- Base C1: `e5626a70b1c9157383b0a0ef2fd34ca68ccfd9d3`.
- Branch: `codex/preview-staging-isolation`.
- Remote code HEAD fetched and verified by Work:
  `3c20029c5053c8c0f9850c31c5c4bb8f7115058f`.
- C2 code commits: `e6edad1` (guard), `3c20029` (three guard tests).
- Only code files changed since C1: `scripts/environment.mjs` and
  `scripts/__tests__/configuration.test.ts`. Closure adds this document only.
- Earlier Work inventory commit `5db0385` was on a divergent local-only branch.
  It is preserved on `codex/preview-staging-inventory-archive`; no history rewritten.
- Deployed Preview code commit, as reported by user: `3c20029`.
- Deployment URL:
  https://farm-to-fork-3bmq-5j460uxmg-robb753s-projects.vercel.app/
- Branch alias:
  https://farm-to-fork-3bmq-git-codex-preview-st-e06858-robb753s-projects.vercel.app/

`npm run build` runs `env:check`. With `VERCEL_ENV=preview`, the guard requires
`NEXT_PUBLIC_SUPABASE_URL` to equal the staging origin and explicitly rejects the
production origin. If `SUPABASE_URL` is supplied, it must also equal staging;
server-variable presence is checked separately by `env:check:runtime`.
This is a build-configuration guard, not verification of credential signatures,
provider access or runtime RLS. Existing C1 local guards remain unchanged.

The user reports manual separation of Preview/Production scopes for
`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and
`SUPABASE_SERVICE_ROLE_KEY`. Work did not reread their hosted values during closure.
No server secret is documented or committed.

## Migrations

Both files remain byte-for-byte identical to C1, verified by Work.

```text
BEFORE / AFTER
20260920213943_verified_app_baseline.sql
before: 8426e7b08dcbf22dad16d72d33c1915d3d3199f45e2284980b48e945e3c16b5a
after:  8426e7b08dcbf22dad16d72d33c1915d3d3199f45e2284980b48e945e3c16b5a
20260921051759_targeted_permissions.sql
before: 7829e8524571761f86531665e059566f0acba5eae189653095374c2f359dbe5f
after:  7829e8524571761f86531665e059566f0acba5eae189653095374c2f359dbe5f
MIGRATIONS UNCHANGED: PASS
```

User-supplied staging evidence: only `verified_app_baseline` and
`targeted_permissions` were applied. Expected application tables and targeted
policies were observed. Remote tool-generated migration timestamps may differ
from local filenames. History was not repaired or rewritten for cosmetic alignment.
Future CLI migration work must inspect that mapping before any push; blindly
replaying the local files would be unsafe. No migration command ran during closure.

## Validation — evidence provenance

### Executed directly by Work during closure

Git fetch confirmed the expected remote HEAD. Work reviewed the full C2 code diff,
verified C1 ancestry and migration hashes, and scanned both C2 commits for private
keys, secret-key literals, JWTs and credential-bearing database URLs. No secret
was found in the C2 changes. Only `.env.example` is tracked; no user `.env.local`
was read, removed or modified. This scan is scoped to C2 changes, not a claim about
all historical repository commits.

`npm run ci:check` exited 0 in Work:

| Command | Result | Executed by |
|---|---|---|
| npm run lint | PASS | Work |
| npm run typecheck | PASS | Work |
| npm run test:unit | PASS — 164 tests | Work |
| npm run db:check | PASS — 289 assertions, zero failures | Work |
| npm run build:ci | PASS — Next.js 15.5.25, 38/38 static pages | Work |

`build:ci` used synthetic keys and its isolated fixture in the already clean
checkout. That build must never be deployed.

### PASS — user Windows evidence (not re-executed by Work)

- 164 unit tests, lint, typecheck and DB/PGlite passed.
- `build:ci` intentionally refused the Windows checkout containing `.env.local`.
  This was the expected safety rejection, not a successful CI build on Windows.
- `npm run build` with the actual local configuration passed: env:check, Next.js
  15.5.25 compilation, lint/types and 39/39 static generation.
- Earlier C1 acceptance includes native Docker reconstruction, seed, real Clerk
  sessions, owner update and Storage tests. No new native C2 run is claimed here.

### PASS — user-supplied Vercel deployment evidence

- First Preview build with production URLs was correctly rejected by env:check.
- After Preview scope separation, deployment of `3c20029` succeeded: env:check,
  compilation, lint/types and 38/38 static generation.
- Work did not replay that deployment or independently retrieve its build logs
  during closure. The final documentation commit is not claimed as deployed.

### PASS — user manual Preview browser and synthetic-test evidence

- `/`, `/explore`, `/sign-in`, `/sign-up` loaded using Clerk Development.
- `/api/get-listings` redirected unauthenticated requests to `/sign-in`.
  With a real session it returned success and initially zero listings.
- A synthetic row was created **directly in staging**, named `C2 STAGING PROOF`,
  slug `c2-staging-proof-20260927`, active true. A direct check found it in staging
  and absent in production.
- Authenticated Preview `/api/get-listings` then returned that staging fixture,
  ID 1, active true, with null clerk_user_id and coordinates.
- The row was deleted only from staging. Final direct checks found it absent
  from both staging and production.

This establishes authenticated Preview **reading** the staging-only fixture, with
absence and cleanup checks supplied by the user. It is **not** evidence that the
row was written through Preview, and Work did not create/read/delete that row or
operate a signed Clerk browser session during closure. No write-through-Preview
or real browser `profiles` test is claimed; the latest user closure criteria rely
on the staging-only fixture read proof. Earlier broader test plans are not marked
as executed by implication.

## Non-regression C1

No C1 dev wrapper, local environment helper, local Supabase config, seed, migration,
RLS policy or application file changed. Work reruns the existing tests, including
the local-environment unit tests and PGlite reconstruction/seed matrix.
Docker, `env:local` and real local browser sessions: NOT RUN by Work during closure.

## Known non-blocking items

HORS SCOPE — À TRAITER PLUS TARD:

- Clerk Development remains in Preview by explicit C2 acceptance; no Clerk
  Production migration performed or planned here.
- `/explore` emits `fetchListings not implemented`; the matching warning in
  `lib/store/unifiedStore.ts` was confirmed by Work. No functional fix made.
- Vercel toolbar/live feedback, CSP, manifest and service-worker console noise was
  reported by the user; it did not prevent the tested routes from loading.
- Legacy `NEXT_PUBLIC_SUPABASE_API_KEY` remains under All Environments according
  to the user's inventory; no code usage was found. Not deleted during C2.

## Production boundary and verdict

No remote writes, configuration changes, deployment, push, merge or promotion were
performed by Work during this closure. Earlier C2 staging provisioning and Preview
configuration are user-supplied evidence; the user reports Production unchanged.
Work does not claim an independent historical audit of every dashboard action.

**C2 COMPLETE** against the latest closure criteria: known Git base, immutable
migrations, passing checks, dedicated staging and user-proven authenticated
Preview reads of a staging-only fixture, absent from production and cleaned up.
Evidence provenance is part of this verdict. C3 has not been started.
