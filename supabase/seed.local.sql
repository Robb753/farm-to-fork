-- SYNTHETIC LOCAL DEVELOPMENT DATA ONLY. Never execute on a hosted project.
-- Reproducible via `supabase db reset --local`; no production rows or files.
begin;

insert into public.listing
  (id, slug, name, description, address, lat, lng, clerk_user_id, active, orders_enabled)
values
  (900001, 'local-ferme-test-900001', '[LOCAL TEST] Ferme fictive',
   'Fixture synthetique C1, aucune exploitation reelle.', 'Adresse fictive - Strasbourg',
   48.58, 7.75, 'user_3Bc9ftGQlBxlSK6wPtXWz8OzYuW', true, false)
on conflict (id) do nothing;

insert into public.profiles (user_id, email, role, farm_id) values
  ('user_2xdHwRCAiBFmMlY8X7L4Ei83HoE', 'admin-local@example.invalid', 'admin', null),
  ('user_3Bc9ftGQlBxlSK6wPtXWz8OzYuW', 'farmer-local@example.invalid', 'farmer', 900001),
  ('user_local_fixture_nonowner', 'user-local@example.invalid', 'user', null)
on conflict (user_id) do nothing;

insert into public.products (id, name, description, farm_id, listing_id, price, unit)
values (900001, '[LOCAL TEST] Pommes', 'Produit synthetique C1.', 900001, 900001, 2.50, 'kg')
on conflict (id) do nothing;

select setval('public.listing_id_seq', (select max(id) from public.listing), true);
select setval('public.products_id_seq', (select max(id) from public.products), true);
-- The public listingImages bucket is reconstructed by the baseline.
-- No storage.objects rows are inserted: upload bytes through the LOCAL Storage API.
commit;
