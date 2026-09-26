# C1 — Local Farm2Fork isolation

Scope: http://localhost:3000 + existing Clerk Development + Supabase Docker on
http://127.0.0.1:54321. No hosted database, Vercel setting or Clerk Dashboard change.
The `getToken({ template: "supabase" })` contract is unchanged. Custom signing is
disabled in the existing template: its Clerk signature must be accepted locally.

## Prerequisites and safety boundary

- Node 24 / npm 11, Docker Desktop running (Linux containers), Git.
- Work from this repository root on `codex/local-env-isolation`.
- Keep existing Clerk Development keys locally; never paste any key/token into chat.
- Every reset below explicitly uses `--local`. It destroys this local stack's data.
- Never add `--linked`, `--db-url`, `--project-ref`, remote `db push` or remote repair.
- The stack project ID remains `farm-to-fork-permissions`; ports 54321/54322 unchanged.
- `.env.local` is not versioned. The setup script does not read or copy production data.
- Clerk Development is still shared with the current public site. C1 isolates Supabase,
  not the Clerk user directory. Do not approve requests or change roles as a local test.
- No production keys are needed locally. CLI status keys are captured in memory only.

## Windows / PowerShell setup

Run in VS Code's PowerShell terminal at the repository root. Stop on any error.
First preserve unrelated local work; do not force checkout/reset Git.

If receiving the C1 Git bundle instead of a remote branch, download it locally and
import it from your repository root (adjust only the download path):

```powershell
git status --short
# Continue only when your working tree is clean.
git fetch origin codex/reconcile-config-build
if ($LASTEXITCODE -ne 0) { throw "Cannot fetch the prerequisite commit" }
git fetch "$HOME\Downloads\Farm2Fork-C1.bundle" codex/local-env-isolation:codex/local-env-isolation
if ($LASTEXITCODE -ne 0) { throw "Bundle import failed; do not force" }
git switch codex/local-env-isolation
if ($LASTEXITCODE -ne 0) { throw "Branch switch failed" }
```

No push or PR is needed to test locally. Publishing a branch may trigger the existing
Vercel integration; C1 was therefore prepared as a local branch without remote publish.

```powershell
node --version
npm --version
docker info
if ($LASTEXITCODE -ne 0) { throw "Start Docker Desktop first" }
npm ci --no-audit --no-fund
if ($LASTEXITCODE -ne 0) { throw "npm ci failed" }
npx --yes supabase@2.117.0 start -x studio,imgproxy,realtime,edge-runtime,logflare,vector,supavisor,mailpit
if ($LASTEXITCODE -ne 0) { throw "LOCAL stack did not start" }
```

Clerk local support is configured in `config.toml`:

```toml
[auth.third_party.clerk]
enabled = true
domain = "humane-buffalo-60.clerk.accounts.dev"
```

This is an issuer hostname, never a secret key. The application still requests the
existing `supabase` template, whose `sub` is the Clerk user ID and top-level `role`
is `authenticated`. A real signed-token browser test is required; SQL claims tests
alone do not prove JWT verification by the local gateway/Storage.

### Native reconstruction and permission tests (local data is disposable)

```powershell
npx --yes supabase@2.117.0 db reset --local --no-seed --yes
if ($LASTEXITCODE -ne 0) { throw "LOCAL empty rebuild failed" }
npm run db:check:supabase
if ($LASTEXITCODE -ne 0) { throw "LOCAL native tests failed; STOP" }
# Remove SQL test actors and reconstruct the developer fixtures instead.
npx --yes supabase@2.117.0 db reset --local --yes
if ($LASTEXITCODE -ne 0) { throw "LOCAL developer reset failed" }
```

The native test checks exact migration history, reconstructed catalog and permission
matrix. These are the unchanged migrations:

- `20260920213943_verified_app_baseline.sql`
- `20260921051759_targeted_permissions.sql`

The CI database job already uses `--local --no-seed`, then the same native verifier.
No remote deployment is part of that job. Do not run native tests against a developer
database with existing rows; perform the empty local reset first, and reseed afterwards.

### Replace only local environment values

Keep your existing `.env.local` with the existing `pk_test_...` and `sk_test_...` keys.
If starting from scratch, copy `.env.example` to `.env.local` and fill those Clerk
Development keys and your existing public Mapbox token locally before continuing.

```powershell
npm run env:local
if ($LASTEXITCODE -ne 0) { throw "Local environment setup failed; STOP" }
npm run dev
```

`env:local` reads **local** `supabase status -o json`, verifies its loopback API, and
updates only these assignments in `.env.local` without printing their values:

| Variable | Local value/source |
| --- | --- |
| `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` |
| `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_URL` | Local status `API_URL` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_ANON_KEY` | Local status `ANON_KEY` |
| `SUPABASE_SERVICE_ROLE_KEY` | Local status `SERVICE_ROLE_KEY` |
| `NEXT_PUBLIC_ALLOW_VERCEL_PREVIEWS` | `false` |
| `NEXT_PUBLIC_VERCEL_URL` | Empty |

Clerk keys, Mapbox and unrelated entries/comments are preserved. There is no remote
fallback. If status lacks a required key or returns an unexpected API target, no file
is written. Variables inherited from PowerShell override `.env.local`; remove only
the conflicting session assignments or open a clean terminal if the guard refuses.

`npm run dev` and direct `next dev` both validate the effective Development config:
loopback Supabase port 54321, localhost app port 3000, the expected Clerk Development
public domain and `sk_test`, required local keys, and **exact key comparison against
the running local stack**. A production service key with a local URL is rejected.
The secret Clerk key's prefix is checked, not its remote validity; login tests check
that it belongs to the same instance. No production build restriction is introduced.

The browser CSP allows local Supabase HTTP/WebSocket endpoints in Development and
does not allow `*.supabase.co` connections there. Supabase image configuration is
derived from the public URL, retaining the existing hosted behavior in Production.
The service-role routes receive the validated local `SUPABASE_URL` (or validated
public URL for `get-listings`); their code and business logic are unchanged.

## Synthetic fixtures

`seed.local.sql` runs only as the configured seed for a LOCAL reset. It is outside
the migration directory. It can run twice without duplicating/modifying fixtures.

- Farm `900001`, slug `local-ferme-test-900001`, `[LOCAL TEST] Ferme fictive`, active.
- Product `900001`, `[LOCAL TEST] Pommes`, attached only to that synthetic farm.
- Admin profile: `user_2xdHwRCAiBFmMlY8X7L4Ei83HoE`.
- Farmer profile: `user_3Bc9ftGQlBxlSK6wPtXWz8OzYuW`, farm `900001`.
- Plain user profile: `user_local_fixture_nonowner` (SQL fixture, **not** a real Clerk login).
- Emails/descriptions are synthetic; no production profile rows are copied.
- `listingImages` bucket comes from the baseline; it starts with no objects.
- No producer request, production listing or historical image is imported.

## Browser acceptance, on localhost only

Before login, open DevTools > Network with Preserve log. Filter `supabase` / `54321`.
All database/Storage requests must target `127.0.0.1:54321` (or localhost). Clerk
requests to `humane-buffalo-60.clerk.accounts.dev` are expected. Any hosted Supabase
request, wrong issuer, unexpected permission result or JWT error means **STOP**.
Do not change the template or use service-role credentials in the browser to fix it.

1. Log in normally as the existing Development admin. Check `window.Clerk.user.id`.
   Visit `/account` and `/admin/notifications`; empty local requests are expected.
2. Log in as the existing Development farmer. Visit `/account`, then
   `/edit-listing/900001`. The synthetic farm must load. Save a harmless change to its
   synthetic description and verify the local API response (no production request).
3. If a separate normal Development user already exists, log in normally and visit
   `/edit-listing/900001`; expect access denied. Do not create/change Clerk accounts
   during C1. The SQL-only fixture is not a substitute for this real-session test.
4. Real JWT acceptance: authenticated `profiles` reads on the local API must succeed.
   The browser client must continue using the `supabase` JWT template, not a fabricated
   JWT and not a service-role key. Report status codes, never headers/tokens.

### Local Storage disposable test

Run the following helper in the localhost Console for each session. Copy the **local
anon `apikey`** from a local request's Network headers into the prompt. No secret or
token is printed. Keep the same test path when switching accounts.

```js
if (location.origin !== 'http://localhost:3000') throw new Error('STOP: not localhost');
window.localStorageTest = {
  key: prompt('LOCAL public anon apikey only'),
  path: `900001/TEST-C1-${crypto.randomUUID()}.txt`,
  owner: 'user_3Bc9ftGQlBxlSK6wPtXWz8OzYuW',
  other: 'user_2xdHwRCAiBFmMlY8X7L4Ei83HoE'
};
window.localStorageTest.call = async function(expectedUser, method, body) {
  if (location.origin !== 'http://localhost:3000' || window.Clerk?.user?.id !== expectedUser)
    throw new Error('STOP: incorrect origin/user');
  if (!/^900001\/TEST-C1-[0-9a-f-]{36}\.txt$/.test(this.path))
    throw new Error('STOP: incorrect test path');
  const jwt = await window.Clerk.session.getToken({template:'supabase'});
  if (!jwt) throw new Error('STOP: no real Clerk template token');
  const base = 'http://127.0.0.1:54321/storage/v1';
  const route = method === 'DELETE' ? '/object/listingImages'
    : `${method === 'GET' ? '/object/authenticated' : '/object'}/listingImages/${this.path}`;
  const response = await fetch(base + route, {
    method, cache:'no-store',
    headers:{apikey:this.key, Authorization:`Bearer ${jwt}`,
      'Content-Type':method === 'DELETE' ? 'application/json' : 'text/plain'},
    ...(method === 'GET' ? {} : {body:method === 'DELETE'
      ? JSON.stringify({prefixes:[this.path]}) : body})
  });
  console.log(response.status, await response.text());
};
console.log(localStorageTest.path);
```

Execute separately and stop on any unexpected result:

- Farmer: `await localStorageTest.call(localStorageTest.owner, 'POST', 'c1-local-test')` → 2xx.
- Keep the printed path. Switch to the admin (a real non-owner for these owner-only
  Storage policies), rerun helper and set `localStorageTest.path` to that exact path.
- `await localStorageTest.call(localStorageTest.other, 'PUT', 'forbidden')` → RLS denial.
- `await localStorageTest.call(localStorageTest.other, 'DELETE')` → denial or 200 `[]`.
- `await localStorageTest.call(localStorageTest.other, 'GET')` → original `c1-local-test`.
- Farmer again, same helper/path: DELETE → succeeds and identifies the removed object.
- Farmer GET afterwards → object absent. Never test a path from the hosted bucket.

The admin serves as non-owner **only for Storage**. Its legitimate admin authority
means it cannot substitute for the normal-user denial test on listing editing.

## Validation and boundaries

- `npm run lint`, `npm run typecheck`, `npm run test:unit`, `npm run db:check`.
- `npm run build:ci` runs only in a clean checkout **without .env.local**; use a separate
  clean checkout for it, rather than moving/deleting your real local configuration.
- Native tests: commands above. No live Clerk browser auth is simulated by SQL tests.
- Work validation: see the C1 execution report below. Never equate a mock status test
  with a running Docker stack or a real signed-token test.

Official references checked for C1 (2026-09-26):
- https://supabase.com/docs/guides/local-development
- https://supabase.com/docs/guides/local-development/cli/config
- https://supabase.com/docs/guides/auth/third-party/clerk
- https://clerk.com/docs/guides/development/integrations/databases/supabase

Production, Preview/staging, Clerk Production, JWT modernization, old deployments,
service workers, domain canonicalization and producer-flow redesign are out of scope.

## C1 execution report — 2026-09-26

Base independently checked against remote Git: `448f260d1e7683b6d539f271cd923f230cbe5f83`.
Dedicated branch: `codex/local-env-isolation`. No changes added to PR #114.

Completed in Work:
- ESLint and TypeScript passed.
- All 161 unit tests passed, including 19 C1 tests.
- Actual `npm run dev` invocation with a production URL exited 1 before launching
  Next or the CLI; no network request was required for that rejection.
- Valid local configuration/key comparison passed with a mocked local status. This
  is not evidence of a working real Docker stack or browser session.
- Two empty PGlite reconstructions and 288 SQL assertions passed, including synthetic
  fixture repeatability and owner/non-owner/admin permissions.
- `npm run build:ci` passed (Next 15.5.25, 38 static pages, fake keys/local fixture).
- Runtime scan: no production project hostname in app/lib/utils/middleware/next config
  or executable helper code; references in negative tests/documentation are intentional.
- No application auth contract, migration SQL or producer logic changed.
- No Supabase production connector calls, remote database commands, Clerk/Vercel
  mutations or Git merge/push were performed during C1.

Unchanged migration SHA-256:
- Baseline: `8426e7b08dcbf22dad16d72d33c1915d3d3199f45e2284980b48e945e3c16b5a`
- Permissions: `7829e8524571761f86531665e059566f0acba5eae189653095374c2f359dbe5f`

Blocker: local `supabase start` returned `LegacyDockerLifecycleInspectError`:
`docker: command not found (podman also not found)`.
No native local reset or native test was attempted after that failure. Docker migration
history, successful real-stack startup and signed Clerk/Storage browser tests remain
pending on the user's PC. Windows execution of the helper is also pending there.
**C1 implementation is ready for local acceptance; C1 is not yet verified end to end.**
