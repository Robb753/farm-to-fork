-- EMERGENCY ONLY. Restores the observed pre-deployment permissions, including known vulnerabilities.

-- Does not change application rows or migration history. Separate explicit approval required.

BEGIN;

SET LOCAL lock_timeout = '5s';

SET LOCAL statement_timeout = '30s';

DROP POLICY IF EXISTS "products_public_read" ON "public"."products";

DROP POLICY IF EXISTS "products_farmer_manage" ON "public"."products";

DROP POLICY IF EXISTS "profiles_self_insert" ON "public"."profiles";

DROP POLICY IF EXISTS "Users can insert their own requests" ON "public"."producer_requests";

DROP POLICY IF EXISTS "Users can view their own requests" ON "public"."producer_requests";

DROP POLICY IF EXISTS "listingImages_owner_read" ON "public"."listingImages";

DROP POLICY IF EXISTS "listingImages_owner_insert" ON "storage"."objects";

DROP POLICY IF EXISTS "listingImages_owner_update" ON "storage"."objects";

DROP POLICY IF EXISTS "listingImages_owner_delete" ON "storage"."objects";

DROP POLICY IF EXISTS "Allow read unclaimed listings" ON "public"."listing";

CREATE POLICY "Allow read unclaimed listings" ON "public"."listing" AS PERMISSIVE FOR SELECT TO PUBLIC USING ((clerk_user_id IS NULL));

DROP POLICY IF EXISTS "Users can insert their own requests" ON "public"."producer_requests";

CREATE POLICY "Users can insert their own requests" ON "public"."producer_requests" AS PERMISSIVE FOR INSERT TO PUBLIC WITH CHECK ((user_id = (auth.uid())::text));

DROP POLICY IF EXISTS "Users can view their own requests" ON "public"."producer_requests";

CREATE POLICY "Users can view their own requests" ON "public"."producer_requests" AS PERMISSIVE FOR SELECT TO PUBLIC USING ((user_id = (auth.uid())::text));

DROP POLICY IF EXISTS "Enable read access for all products" ON "public"."products";

CREATE POLICY "Enable read access for all products" ON "public"."products" AS PERMISSIVE FOR ALL TO PUBLIC USING (true);

DROP POLICY IF EXISTS "products_farmer_manage" ON "public"."products";

CREATE POLICY "products_farmer_manage" ON "public"."products" AS PERMISSIVE FOR ALL TO PUBLIC USING ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.user_id = (auth.jwt() ->> 'sub'::text)) AND (p.role = ANY (ARRAY['farmer'::text, 'admin'::text])) AND (p.farm_id = products.farm_id))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.user_id = (auth.jwt() ->> 'sub'::text)) AND (p.role = ANY (ARRAY['farmer'::text, 'admin'::text])) AND (p.farm_id = products.farm_id)))));

DROP POLICY IF EXISTS "profiles_self_insert" ON "public"."profiles";

CREATE POLICY "profiles_self_insert" ON "public"."profiles" AS PERMISSIVE FOR INSERT TO PUBLIC WITH CHECK ((user_id = current_clerk_user_id()));

DROP POLICY IF EXISTS "Public 16jtzx8_1" ON "storage"."objects";

CREATE POLICY "Public 16jtzx8_1" ON "storage"."objects" AS PERMISSIVE FOR INSERT TO PUBLIC WITH CHECK ((bucket_id = 'listingImages'::text));

DROP POLICY IF EXISTS "Public 16jtzx8_2" ON "storage"."objects";

CREATE POLICY "Public 16jtzx8_2" ON "storage"."objects" AS PERMISSIVE FOR UPDATE TO PUBLIC USING ((bucket_id = 'listingImages'::text));

DROP POLICY IF EXISTS "Public 16jtzx8_3" ON "storage"."objects";

CREATE POLICY "Public 16jtzx8_3" ON "storage"."objects" AS PERMISSIVE FOR DELETE TO PUBLIC USING ((bucket_id = 'listingImages'::text));

GRANT REFERENCES ON public."listing" TO "anon";

GRANT TRIGGER ON public."listing" TO "anon";

GRANT TRUNCATE ON public."listing" TO "anon";

GRANT REFERENCES ON public."listing" TO "authenticated";

GRANT TRIGGER ON public."listing" TO "authenticated";

GRANT TRUNCATE ON public."listing" TO "authenticated";

GRANT REFERENCES ON public."listingImages" TO "anon";

GRANT TRIGGER ON public."listingImages" TO "anon";

GRANT TRUNCATE ON public."listingImages" TO "anon";

GRANT REFERENCES ON public."listingImages" TO "authenticated";

GRANT TRIGGER ON public."listingImages" TO "authenticated";

GRANT TRUNCATE ON public."listingImages" TO "authenticated";

GRANT DELETE ON public."osm_import_review" TO "anon";

GRANT INSERT ON public."osm_import_review" TO "anon";

GRANT REFERENCES ON public."osm_import_review" TO "anon";

GRANT SELECT ON public."osm_import_review" TO "anon";

GRANT TRIGGER ON public."osm_import_review" TO "anon";

GRANT TRUNCATE ON public."osm_import_review" TO "anon";

GRANT UPDATE ON public."osm_import_review" TO "anon";

GRANT DELETE ON public."osm_import_review" TO "authenticated";

GRANT INSERT ON public."osm_import_review" TO "authenticated";

GRANT REFERENCES ON public."osm_import_review" TO "authenticated";

GRANT SELECT ON public."osm_import_review" TO "authenticated";

GRANT TRIGGER ON public."osm_import_review" TO "authenticated";

GRANT TRUNCATE ON public."osm_import_review" TO "authenticated";

GRANT UPDATE ON public."osm_import_review" TO "authenticated";

GRANT DELETE ON public."products" TO "anon";

GRANT INSERT ON public."products" TO "anon";

GRANT REFERENCES ON public."products" TO "anon";

GRANT TRIGGER ON public."products" TO "anon";

GRANT TRUNCATE ON public."products" TO "anon";

GRANT UPDATE ON public."products" TO "anon";

GRANT REFERENCES ON public."products" TO "authenticated";

GRANT TRIGGER ON public."products" TO "authenticated";

GRANT TRUNCATE ON public."products" TO "authenticated";

GRANT REFERENCES ON public."profiles" TO "anon";

GRANT TRIGGER ON public."profiles" TO "anon";

GRANT TRUNCATE ON public."profiles" TO "anon";

GRANT REFERENCES ON public."profiles" TO "authenticated";

GRANT TRIGGER ON public."profiles" TO "authenticated";

GRANT TRUNCATE ON public."profiles" TO "authenticated";

GRANT UPDATE ON SEQUENCE public."osm_import_review_id_seq" TO "anon";

GRANT UPDATE ON SEQUENCE public."osm_import_review_id_seq" TO "authenticated";

GRANT UPDATE ON SEQUENCE public."listing_id_seq" TO "anon";

GRANT UPDATE ON SEQUENCE public."listing_id_seq" TO "authenticated";

GRANT UPDATE ON SEQUENCE public."listingImages_id_seq" TO "anon";

GRANT UPDATE ON SEQUENCE public."listingImages_id_seq" TO "authenticated";

GRANT UPDATE ON SEQUENCE public."profiles_id_seq" TO "anon";

GRANT UPDATE ON SEQUENCE public."profiles_id_seq" TO "authenticated";

GRANT UPDATE ON SEQUENCE public."products_id_seq" TO "anon";

GRANT UPDATE ON SEQUENCE public."products_id_seq" TO "authenticated";

ALTER TABLE public.osm_import_review DISABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select
    -- ✅ Bootstrap: email admin (si présent dans le JWT)
    coalesce(lower(auth.jwt() -> 'user_metadata' ->> 'email'), '') = 'admin@farmtofork.fr'
    OR
    coalesce(lower(auth.jwt() ->> 'email'), '') = 'admin@farmtofork.fr'
    OR
    -- ✅ Sinon fallback: role stocké en DB (comme avant)
    exists (
      select 1
      from public.profiles p
      where p.user_id = (auth.jwt() ->> 'sub')
        and p.role = 'admin'
    );
$function$;

COMMIT;
