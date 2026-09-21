-- Read only. No role assignment, auth change, migration repair or row mutation.
BEGIN TRANSACTION READ ONLY;
SET LOCAL statement_timeout = '15s';
SELECT current_database() AS database, current_user AS inspected_as,
       current_setting('transaction_read_only') AS read_only,
       to_regclass('supabase_migrations.schema_migrations') AS history_table;
-- Use migration list / connected list_migrations separately; absent history table is valid.
SELECT count(*) FILTER (WHERE role = 'admin') AS admin_profiles,
       count(*) FILTER (WHERE role = 'admin' AND user_id LIKE 'user_%' AND email IS NOT NULL) AS clerk_admin_profiles,
       count(*) FILTER (WHERE role = 'admin' AND (user_id IS NULL OR user_id = '')) AS unusable_admin_profiles
FROM public.profiles;
-- Existing rows remain unchanged, but these rows may become uneditable by their owners.
SELECT count(*) AS inconsistent_product_bindings FROM public.products
WHERE listing_id IS NOT NULL AND listing_id IS DISTINCT FROM farm_id;
SELECT count(*) AS owners_without_matching_farmer_profile FROM public.listing l
WHERE l.clerk_user_id IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.user_id=l.clerk_user_id
  AND p.farm_id=l.id AND p.role IN ('farmer','admin')
);
SELECT count(*) AS storage_objects_without_owner_path FROM storage.objects o
WHERE o.bucket_id='listingImages' AND NOT EXISTS (
  SELECT 1 FROM public.listing l
  WHERE l.id::text=split_part(o.name,'/',1) AND l.clerk_user_id IS NOT NULL
);
SELECT count(*) AS unclaimed_inactive_listings FROM public.listing
WHERE clerk_user_id IS NULL AND active IS DISTINCT FROM true;
SELECT count(*) AS pending_producer_requests FROM public.producer_requests WHERE status='pending';
COMMIT;
