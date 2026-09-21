-- Migration : protection des listings revendiqués contre l'écrasement par le script d'import OSM
-- Date: 2026-03-07
-- Quand un listing OSM est revendiqué (clerk_user_id IS NOT NULL), les champs éditables
-- par le producteur (nom, description, email, téléphone, site, horaires) ne doivent
-- plus être écrasés par un re-import depuis OSM.

-- ==================== NETTOYAGE ====================

DROP TRIGGER IF EXISTS trigger_protect_claimed_listing ON public.listing;
DROP FUNCTION IF EXISTS protect_claimed_listing();

-- ==================== FONCTION ====================

CREATE OR REPLACE FUNCTION protect_claimed_listing()
RETURNS TRIGGER AS $$
BEGIN
  -- Appliquer uniquement si la ligne a un osm_id (ferme importée) ET un clerk_user_id (revendiquée)
  IF OLD.osm_id IS NOT NULL AND OLD.clerk_user_id IS NOT NULL THEN
    -- Conserver les champs que le producteur peut avoir modifiés
    NEW.clerk_user_id     := OLD.clerk_user_id;
    NEW.name              := OLD.name;
    NEW.description       := OLD.description;
    NEW.email             := OLD.email;
    NEW."phoneNumber"     := OLD."phoneNumber";
    NEW.website           := OLD.website;
    NEW.opening_hours     := OLD.opening_hours;
    NEW.pickup_days       := OLD.pickup_days;
    NEW.delivery_available:= OLD.delivery_available;
    NEW.active            := OLD.active;
    NEW.orders_enabled    := OLD.orders_enabled;
    NEW.profileImage      := OLD.profileImage;
    NEW.certifications    := OLD.certifications;
    NEW.product_type      := OLD.product_type;
    NEW.purchase_mode     := OLD.purchase_mode;
    NEW.production_method := OLD.production_method;
    NEW.additional_services := OLD.additional_services;

    -- Les champs purement OSM peuvent être mis à jour (adresse, coordonnées, type)
    -- NEW.address, NEW.lat, NEW.lng, NEW.typeferme, NEW.osm_id → laissés tels quels
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==================== TRIGGER ====================

CREATE TRIGGER trigger_protect_claimed_listing
  BEFORE UPDATE ON public.listing
  FOR EACH ROW
  EXECUTE FUNCTION protect_claimed_listing();

-- ==================== COMMENTAIRES ====================

COMMENT ON FUNCTION protect_claimed_listing() IS
'Protège les listings OSM revendiqués contre l''écrasement de leurs données lors d''un re-import depuis OpenStreetMap. Seuls les champs purement géographiques (address, lat, lng, typeferme) peuvent être mis à jour après revendication.';

COMMENT ON TRIGGER trigger_protect_claimed_listing ON public.listing IS
'Trigger BEFORE UPDATE qui preserve les données éditées par le producteur si le listing a été revendiqué (clerk_user_id IS NOT NULL AND osm_id IS NOT NULL).';
