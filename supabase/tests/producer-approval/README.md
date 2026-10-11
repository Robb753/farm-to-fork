# Producer approval invariants — isolated validation

Scope: step 1 only. Base master `89b0eaed78ca6c20e079e6b4e067906e152a32f9`.
Production was queried read-only on 2026-10-10. No migration was applied remotely.

## Reproduction and provenance

Run `npm ci` then `npm run db:check:producer`. This command only creates an
in-memory PGlite PostgreSQL database. It accepts no database URL or credentials.
`node scripts/check-producer-approval.mjs --before-only` reproduces old defects.
Expected pre-fix invariant failures are asserted, so this command exits zero only
when the documented old behavior is reproduced.

Fixtures are byte-identical copies from commit
`b03f8111da248c61770d9031af5b9fbe35ed2b8b`, placed OUTSIDE migrations:

- baseline.sql = 20260920213943_verified_app_baseline.sql
  SHA256 8426e7b08dcbf22dad16d72d33c1915d3d3199f45e2284980b48e945e3c16b5a
- permissions.sql = 20260921051759_targeted_permissions.sql
  SHA256 7829e8524571761f86531665e059566f0acba5eae189653095374c2f359dbe5f
- platform.sql = the isolated Supabase SQL boundary fixture from that commit.
  It is NOT a native Storage/Auth server. No Storage operations are tested here.

The historical migrations do not exist at their original paths on this master.
They were not added to its migration directory or changed on their source branch.
The runner verifies hashes and compares four pre-fix function bodies against
hashes read directly from the Production catalog. Fixtures contain no business data.

## Root cause

Production has two AFTER UPDATE triggers: `on_producer_request_approval` then
`trigger_handle_producer_request_approval`, in alphabetical execution order.
Both reference exactly `handle_producer_request_approval()`.
The catalog cannot explain who created the duplicate or why. Git first records
both in the exported baseline, not in separate historical creation migrations.
It would be incorrect to attribute a specific original deployment cause.

Both invoke the same unconditional create path, even for claims. The slug's
transaction timestamp and ON CONFLICT DO NOTHING usually suppress the second
insert; this is accidental deduplication, not a claim or association guarantee.
Approved-to-approved updates already do nothing. Different requests with the same
farm name/time can also collide and silently lose their created listing.

The function never assigns profiles.farm_id. An existing user profile fails its
role UPDATE because profile protection calls is_admin() using the JWT sub, while
the API approves with service_role, without the admin's Clerk JWT. SECURITY DEFINER
and BYPASSRLS do not disable these explicit protection triggers.
The older farmer_requests function sets app.bypass_sensitive; this producer
function did not. The profile protection functions themselves are unchanged.

## Correction

Only the new `20261010221509_producer_approval_invariants.sql` is a deployable
change. Never replay baseline.sql or permissions.sql on an existing database.
Do not run a blanket db push from this master: it still carries older migration
history. Staging adoption/deployment must review the pending list separately.

- Replace the duplicate triggers with one BEFORE INSERT OR UPDATE trigger.
- Reject initially approved requests; allow approval only from pending and only
  under trusted backend SQL role. Caller-controlled JWT role cannot authorize it.
- CREATE inserts one inactive listing; request UUID makes its slug collision-safe.
- CLAIM locks and assigns the existing unowned listing, without creating one.
  Already owned or missing targets fail atomically.
- Lock approvals per applicant and reject conflicting existing farm associations.
- Preserve admin profiles by rejecting a producer approval that would demote one.
- Upsert farmer role/farm_id while retaining an existing profile's email.
- Scope the existing sensitive-field bypass to this internal upsert, restoring
  its prior value immediately. SQL errors roll back the entire statement.
- Store listing_id through NEW, avoiding recursive request UPDATEs.
- Approved identity/type/listing/status cannot be rewritten; repeat approval has
  no new side effect. Other fields (e.g. admin note) remain editable by backend.
- Revoke direct execution from public/anon/authenticated; no RLS policy changed.

This is not a repair of already inconsistent Production data. Clerk sync,
frontend, old APIs, products and publication are explicitly deferred.

## Work-executed evidence

Before correction: A create/new FAIL (farm_id NULL); B create/existing FAIL
(protected role); C claim FAIL (wrong new listing and farm_id NULL); C2 claim with
existing profile FAIL; D reapproval PASS; E occupied claim FAIL (not rejected);
F ordinary user's approval UPDATE PASS (no rows authorized).

After correction: all 14 scenarios PASS (A-F plus C2 and G-M):
new/existing profiles, claim, reapproval, occupied target rejection, non-admin,
approved INSERT denial, bypass restoration/profile protection, immutable approved
association, forged JWT/bypass denial, injected profile failure with full rollback,
conflicting farm mapping rejection, and two equal farm names without collision.
The corrective DDL is applied twice in memory; exactly one approval trigger remains.

`npm run lint`: PASS. `npm run typecheck`: PASS.
`npm run test:unit`: PASS, 145 tests across 5 files.
`npm run db:check:producer`: PASS, 7 pre-fix observations + 14 post-fix scenarios.
`git diff --check`: PASS.

Docker is unavailable: native Supabase and real concurrent-session tests NOT RUN.
PGlite checks SQL semantics with synthetic roles/claims; they do not validate Clerk
sessions, PostgREST, or the browser. No user manual validation is claimed here.

Ready for isolated STAGING validation, not authorization to deploy Production.
