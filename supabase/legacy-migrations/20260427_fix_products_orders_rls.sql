-- ============================================================
-- Migration : Correction des policies RLS products et orders
-- Date      : 2026-04-27
-- Contexte  : La migration 20250101_create_shop_tables.sql
--             référençait la table "listings" (pluriel) et la
--             colonne "user_id", qui n'existent pas.
--             La vraie table est "listing" (singulier) et la
--             vraie colonne est "clerk_user_id".
--
-- À EXÉCUTER MANUELLEMENT dans le SQL Editor de Supabase.
-- NE PAS exécuter via supabase db push sans vérification préalable.
-- ============================================================


-- ============================================================
-- ÉTAPE 1 : VÉRIFICATION (exécuter d'abord, vérifier le résultat)
-- ============================================================
-- Cette requête liste les policies actuelles sur products et orders.
-- Avant de continuer, vérifiez que les noms correspondent bien à
-- ceux listés ci-dessous dans les DROP POLICY.

SELECT
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('products', 'orders')
ORDER BY tablename, policyname;

-- Résultat attendu (policies avec le bug) :
--   products | "Farmers can manage their products"  | ALL    | farm_id IN (SELECT id FROM listings WHERE user_id = ...)
--   orders   | "Farmers can view their farm orders"  | SELECT | farm_id IN (SELECT id FROM listings WHERE user_id = ...)
--   orders   | "Farmers can update their farm orders"| UPDATE | farm_id IN (SELECT id FROM listings WHERE user_id = ...)

-- ⚠️  Si les noms affichés diffèrent, adaptez les DROP POLICY ci-dessous.


-- ============================================================
-- ÉTAPE 2 : CORRECTION — table products
-- ============================================================
-- Supprime l'ancienne policy (table "listings" + colonne "user_id")
-- et la recrée avec les noms corrects ("listing" + "clerk_user_id").

DROP POLICY IF EXISTS "Farmers can manage their products" ON public.products;

CREATE POLICY "Farmers can manage their products"
  ON public.products
  FOR ALL
  USING (
    farm_id IN (
      SELECT id FROM public.listing WHERE clerk_user_id = auth.uid()::text
    )
  )
  WITH CHECK (
    farm_id IN (
      SELECT id FROM public.listing WHERE clerk_user_id = auth.uid()::text
    )
  );

-- Note : WITH CHECK est requis pour couvrir les INSERT via FOR ALL.
-- Sans lui, Postgres utilise USING comme fallback pour INSERT,
-- mais être explicite évite toute ambiguïté.


-- ============================================================
-- ÉTAPE 3 : CORRECTION — table orders (SELECT fermier)
-- ============================================================

DROP POLICY IF EXISTS "Farmers can view their farm orders" ON public.orders;

CREATE POLICY "Farmers can view their farm orders"
  ON public.orders
  FOR SELECT
  USING (
    farm_id IN (
      SELECT id FROM public.listing WHERE clerk_user_id = auth.uid()::text
    )
  );


-- ============================================================
-- ÉTAPE 4 : CORRECTION — table orders (UPDATE fermier)
-- ============================================================

DROP POLICY IF EXISTS "Farmers can update their farm orders" ON public.orders;

CREATE POLICY "Farmers can update their farm orders"
  ON public.orders
  FOR UPDATE
  USING (
    farm_id IN (
      SELECT id FROM public.listing WHERE clerk_user_id = auth.uid()::text
    )
  )
  WITH CHECK (
    farm_id IN (
      SELECT id FROM public.listing WHERE clerk_user_id = auth.uid()::text
    )
  );


-- ============================================================
-- ÉTAPE 5 : VÉRIFICATION APRÈS EXÉCUTION
-- ============================================================
-- Relancer cette requête après les corrections.
-- Les colonnes "qual" doivent maintenant référencer "listing"
-- et "clerk_user_id".

SELECT
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('products', 'orders')
ORDER BY tablename, policyname;

-- Résultat attendu (policies corrigées) :
--   products | "Farmers can manage their products"   | ALL    | farm_id IN (SELECT id FROM listing WHERE clerk_user_id = ...)
--   orders   | "Farmers can view their farm orders"  | SELECT | farm_id IN (SELECT id FROM listing WHERE clerk_user_id = ...)
--   orders   | "Farmers can update their farm orders"| UPDATE | farm_id IN (SELECT id FROM listing WHERE clerk_user_id = ...)
