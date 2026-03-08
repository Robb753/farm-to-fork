-- Migration: listing_claim_requests
-- Flow: user submits a claim → admin approves/rejects → claim is applied on approval

CREATE TABLE IF NOT EXISTS listing_claim_requests (
  id           SERIAL PRIMARY KEY,

  -- Référence à la ferme revendiquée
  listing_id   INTEGER     NOT NULL REFERENCES listing(id) ON DELETE CASCADE,

  -- Identifiants du demandeur (Clerk)
  user_id      TEXT        NOT NULL,
  user_email   TEXT        NOT NULL,
  user_name    TEXT,

  -- Message optionnel du demandeur
  message      TEXT,

  -- Statut de la demande
  status       TEXT        NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'approved', 'rejected')),

  -- Note interne de l'administrateur
  admin_note   TEXT,

  -- Administrateur ayant traité la demande
  reviewed_by  TEXT,
  reviewed_at  TIMESTAMPTZ,

  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Un seul enregistrement actif par couple (listing, user)
  UNIQUE (listing_id, user_id)
);

-- RLS : activé mais géré via service role key dans nos routes API
ALTER TABLE listing_claim_requests ENABLE ROW LEVEL SECURITY;

-- Index pour les requêtes admin courantes
CREATE INDEX IF NOT EXISTS idx_claim_requests_status  ON listing_claim_requests(status);
CREATE INDEX IF NOT EXISTS idx_claim_requests_listing ON listing_claim_requests(listing_id);
CREATE INDEX IF NOT EXISTS idx_claim_requests_user    ON listing_claim_requests(user_id);
