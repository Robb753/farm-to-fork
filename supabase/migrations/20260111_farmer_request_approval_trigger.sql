-- Migration pour créer le trigger d'approbation automatique des farmers
-- Date: 2026-01-11
-- Description: Crée automatiquement profile + listing quand farmer_requests.status devient "approved"

-- ==================== NETTOYAGE ====================

-- Supprimer le trigger s'il existe déjà
DROP TRIGGER IF EXISTS trigger_handle_farmer_request_approval ON public.farmer_requests;

-- Supprimer la fonction s'il existe déjà
DROP FUNCTION IF EXISTS handle_farmer_request_approval();

-- ==================== FONCTION ====================

-- Fonction qui crée automatiquement profile + listing lors de l'approbation
CREATE OR REPLACE FUNCTION handle_farmer_request_approval()
RETURNS TRIGGER AS $$
DECLARE
  new_listing_id BIGINT;
BEGIN
  -- Vérifier que le status est passé à "approved" (et n'était pas déjà approved)
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN

    -- 1. Créer le profile avec role='farmer'
    INSERT INTO public.profiles (
      user_id,
      email,
      role,
      farm_id,
      created_at,
      updated_at
    ) VALUES (
      NEW.user_id,
      NEW.email,
      'farmer',
      NULL, -- sera mis à jour après création du listing
      NOW(),
      NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
      role = 'farmer',
      email = NEW.email,
      updated_at = NOW();

    -- 2. Créer le listing avec active=false et orders_enabled=false
    INSERT INTO public.listing (
      clerk_user_id,
      name,
      description,
      email,
      phoneNumber,
      website,
      address,
      lat,
      lng,
      active,
      orders_enabled,
      delivery_available,
      created_at,
      updated_at
    ) VALUES (
      NEW.user_id,
      NEW.farm_name,
      NEW.description,
      NEW.email,
      NEW.phone,
      NEW.website,
      NEW.location,
      NEW.lat,
      NEW.lng,
      false, -- le farmer décide d'activer ou non
      false, -- le farmer décide d'activer les commandes ou non
      false, -- par défaut pas de livraison
      NOW(),
      NOW()
    )
    RETURNING id INTO new_listing_id;

    -- 3. Mettre à jour le profile avec le farm_id
    UPDATE public.profiles
    SET
      farm_id = new_listing_id,
      updated_at = NOW()
    WHERE user_id = NEW.user_id;

    RAISE NOTICE 'Profile et listing créés automatiquement pour user_id=%, listing_id=%', NEW.user_id, new_listing_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==================== TRIGGER ====================

-- Créer le trigger qui s'exécute après mise à jour de farmer_requests
CREATE TRIGGER trigger_handle_farmer_request_approval
  AFTER UPDATE ON public.farmer_requests
  FOR EACH ROW
  EXECUTE FUNCTION handle_farmer_request_approval();

-- ==================== COMMENTAIRES ====================

COMMENT ON FUNCTION handle_farmer_request_approval() IS
'Fonction trigger qui crée automatiquement un profile (role=farmer) et un listing (active=false, orders_enabled=false) quand farmer_requests.status devient approved';

COMMENT ON TRIGGER trigger_handle_farmer_request_approval ON public.farmer_requests IS
'Trigger qui crée automatiquement profile + listing lors de l''approbation d''une demande farmer';
