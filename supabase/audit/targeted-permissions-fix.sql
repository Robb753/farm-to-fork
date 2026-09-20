-- DRAFT ONLY — DO NOT APPLY DIRECTLY TO PRODUCTION.
-- Prepared from the live read-only inventory on 2026-09-20.
-- Validate on an isolated Supabase environment with real Clerk JWTs (visitor/A/B/admin)
-- before converting this file into a migration.
--
-- Scope: configuration reconciliation only. No producer-flow redesign.

begin;

-- 1) Clerk IDs are text user_… values; auth.uid() is UUID-oriented.
drop policy if exists "Users can insert their own requests" on public.producer_requests;
create policy "Users can insert their own requests"
on public.producer_requests
for insert
to authenticated
with check (user_id = (auth.jwt() ->> 'sub'));

drop policy if exists "Users can view their own requests" on public.producer_requests;
create policy "Users can view their own requests"
on public.producer_requests
for select
to authenticated
using (user_id = (auth.jwt() ->> 'sub'));

-- 2) Products: preserve public reads, remove the permissive ALL policy.
drop policy if exists "Enable read access for all products" on public.products;
create policy "products_public_read"
on public.products
for select
to anon, authenticated
using (true);

drop policy if exists "products_farmer_manage" on public.products;
create policy "products_farmer_manage"
on public.products
for all
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.user_id = (auth.jwt() ->> 'sub')
      and p.role = any (array['farmer'::text, 'admin'::text])
      and p.farm_id = products.farm_id
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.user_id = (auth.jwt() ->> 'sub')
      and p.role = any (array['farmer'::text, 'admin'::text])
      and p.farm_id = products.farm_id
  )
);

revoke insert, update, delete, truncate, references, trigger
on public.products from anon;

-- 3) OSM review is an internal/import table, not a public client surface.
alter table public.osm_import_review enable row level security;
revoke all privileges on public.osm_import_review from anon, authenticated;

-- 4) A self-created profile must start as a plain user with no farm binding.
drop policy if exists "profiles_self_insert" on public.profiles;
create policy "profiles_self_insert"
on public.profiles
for insert
to authenticated
with check (
  user_id = public.current_clerk_user_id()
  and coalesce(role, 'user') = 'user'
  and farm_id is null
);

-- 5) Public visibility is already covered by listing_public_read(active = true).
-- Remove the extra rule that exposes every unclaimed listing, including inactive rows.
drop policy if exists "Allow read unclaimed listings" on public.listing;

-- 6) Storage paths are currently written as "<listingId>/<timestamp>-<filename>".
-- Keep public SELECT for the public bucket, but restrict writes to the owner of
-- the listing referenced by the first path segment.
drop policy if exists "Public 16jtzx8_1" on storage.objects;
drop policy if exists "Public 16jtzx8_2" on storage.objects;
drop policy if exists "Public 16jtzx8_3" on storage.objects;

create policy "listingImages_owner_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'listingImages'
  and split_part(name, '/', 1) ~ '^[0-9]+$'
  and exists (
    select 1
    from public.listing l
    where l.id = split_part(name, '/', 1)::bigint
      and l.clerk_user_id = (auth.jwt() ->> 'sub')
  )
);

create policy "listingImages_owner_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'listingImages'
  and split_part(name, '/', 1) ~ '^[0-9]+$'
  and exists (
    select 1
    from public.listing l
    where l.id = split_part(name, '/', 1)::bigint
      and l.clerk_user_id = (auth.jwt() ->> 'sub')
  )
)
with check (
  bucket_id = 'listingImages'
  and split_part(name, '/', 1) ~ '^[0-9]+$'
  and exists (
    select 1
    from public.listing l
    where l.id = split_part(name, '/', 1)::bigint
      and l.clerk_user_id = (auth.jwt() ->> 'sub')
  )
);

create policy "listingImages_owner_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'listingImages'
  and split_part(name, '/', 1) ~ '^[0-9]+$'
  and exists (
    select 1
    from public.listing l
    where l.id = split_part(name, '/', 1)::bigint
      and l.clerk_user_id = (auth.jwt() ->> 'sub')
  )
);

-- Deliberately NOT changed here:
-- * is_admin(): current bootstrap depends on JWT email claims; change only after
--   the live Clerk issuer/claims are verified, otherwise admin access may be lost.
-- * producer approval triggers: identified as duplicated/broken, but changing
--   their business behavior belongs to the next producer-flow task.
-- * historical migrations: do not replay them.

commit;
