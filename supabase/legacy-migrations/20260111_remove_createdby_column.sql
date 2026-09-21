-- Migration pour supprimer la colonne createdBy de la table listing
-- Date: 2026-01-11
-- Description: Supprime createdBy car on utilise clerk_user_id maintenant

-- ==================== NETTOYAGE ====================

-- 1. Supprimer les index liés à createdBy
DROP INDEX IF EXISTS public.idx_listing_createdby;
DROP INDEX IF EXISTS public.listing_createdby_unique;

-- 2. Supprimer la contrainte unique sur createdBy
ALTER TABLE public.listing DROP CONSTRAINT IF EXISTS listing_createdBy_key;

-- 3. Supprimer la colonne createdBy
ALTER TABLE public.listing DROP COLUMN IF EXISTS "createdBy";

-- ==================== COMMENTAIRE ====================

COMMENT ON TABLE public.listing IS 'Table des listings de fermes. Utilise clerk_user_id pour identifier le propriétaire.';
