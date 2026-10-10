-- Corrective migration only. Never replay the verified baseline on an existing DB.
BEGIN;
DROP TRIGGER IF EXISTS on_producer_request_approval ON public.producer_requests;
DROP TRIGGER IF EXISTS trigger_handle_producer_request_approval ON public.producer_requests;

CREATE OR REPLACE FUNCTION public.handle_producer_request_approval()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  target_id bigint;
  target_owner text;
  profile_role text;
  profile_farm bigint;
  previous_bypass text;
BEGIN
  -- INSERT policies only check user_id: never accept a pre-approved request.
  IF TG_OP = 'INSERT' THEN
    IF NEW.status IS DISTINCT FROM 'pending' THEN
      RAISE EXCEPTION 'New producer requests must be pending' USING ERRCODE = '23514';
    END IF;
    RETURN NEW;
  END IF;

  IF OLD.status = 'approved' THEN
    IF (NEW.status, NEW.user_id, NEW.type, NEW.listing_id)
       IS DISTINCT FROM (OLD.status, OLD.user_id, OLD.type, OLD.listing_id) THEN
      RAISE EXCEPTION 'Approved producer request association is immutable' USING ERRCODE = '23514';
    END IF;
    RETURN NEW;
  END IF;
  IF NEW.status <> 'approved' THEN RETURN NEW; END IF;
  -- current_user is the definer here. Inspect the actual SQL role selected by
  -- PostgREST instead, never a caller-supplied metadata/admin claim.
  IF coalesce(current_setting('role', true), 'none') NOT IN ('service_role', 'postgres')
     AND NOT (current_setting('role', true) = 'none' AND session_user = 'postgres') THEN
    RAISE EXCEPTION 'Approval requires the trusted backend' USING ERRCODE = '42501';
  END IF;
  IF OLD.status <> 'pending' OR
     (NEW.user_id, NEW.type, NEW.listing_id) IS DISTINCT FROM
     (OLD.user_id, OLD.type, OLD.listing_id) THEN
    RAISE EXCEPTION 'Invalid approval transition' USING ERRCODE = '23514';
  END IF;

  -- Serialize approvals for the same applicant, including an absent profile.
  PERFORM pg_advisory_xact_lock(hashtextextended(NEW.user_id, 0));
  SELECT role, farm_id INTO profile_role, profile_farm
    FROM public.profiles WHERE user_id = NEW.user_id FOR UPDATE;
  IF profile_role = 'admin' THEN
    RAISE EXCEPTION 'Cannot demote an admin through producer approval' USING ERRCODE = '23514';
  END IF;

  IF NEW.type = 'claim' THEN
    SELECT clerk_user_id INTO target_owner FROM public.listing
      WHERE id = NEW.listing_id FOR UPDATE;
    IF NOT FOUND OR target_owner IS NOT NULL THEN
      RAISE EXCEPTION 'Claim target missing or already owned' USING ERRCODE = '23514';
    END IF;
    target_id := NEW.listing_id;
    IF profile_farm IS NOT NULL AND profile_farm <> target_id THEN
      RAISE EXCEPTION 'Profile already associated with another farm' USING ERRCODE = '23514';
    END IF;
    UPDATE public.listing SET clerk_user_id = NEW.user_id WHERE id = target_id;
  ELSIF NEW.type = 'create' THEN
    IF NEW.listing_id IS NOT NULL OR profile_farm IS NOT NULL THEN
      RAISE EXCEPTION 'Create request already associated with a farm' USING ERRCODE = '23514';
    END IF;
    INSERT INTO public.listing
      (clerk_user_id, name, description, "phoneNumber", website, address,
       lat, lng, active, orders_enabled, delivery_available, slug)
    VALUES
      (NEW.user_id, NEW.farm_name, NEW.description, NEW.phone, NEW.website,
       NEW.location, NEW.lat, NEW.lng, false, false, false,
       lower(regexp_replace(coalesce(NEW.farm_name, 'ferme'), '[^a-zA-Z0-9]+', '-', 'g')) || '-' || NEW.id::text)
    RETURNING id INTO target_id;
  ELSE
    RAISE EXCEPTION 'Unknown producer request type' USING ERRCODE = '23514';
  END IF;

  previous_bypass := coalesce(current_setting('app.bypass_sensitive', true), '');
  PERFORM set_config('app.bypass_sensitive', 'on', true);
  INSERT INTO public.profiles (user_id, email, role, farm_id)
    VALUES (NEW.user_id, NEW.user_email, 'farmer', target_id)
    ON CONFLICT (user_id) DO UPDATE SET role = 'farmer', farm_id = EXCLUDED.farm_id;
  PERFORM set_config('app.bypass_sensitive', previous_bypass, true);
  NEW.listing_id := target_id;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.handle_producer_request_approval() FROM PUBLIC, anon, authenticated;
-- BEFORE avoids recursively updating producer_requests to persist listing_id.
CREATE TRIGGER on_producer_request_approval
BEFORE INSERT OR UPDATE ON public.producer_requests
FOR EACH ROW EXECUTE FUNCTION public.handle_producer_request_approval();
COMMIT;
