-- Colonne referral_code sur organisations (code du parrain qui a amené ce client)
ALTER TABLE organisations ADD COLUMN IF NOT EXISTS referral_code text;
ALTER TABLE organisations ADD COLUMN IF NOT EXISTS referral_rewarded boolean DEFAULT false;

-- Table parrainages pour tracker
CREATE TABLE IF NOT EXISTS parrainages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  parrain_org_id uuid REFERENCES organisations(id) ON DELETE SET NULL,
  filleul_org_id uuid REFERENCES organisations(id) ON DELETE SET NULL,
  statut text DEFAULT 'en_attente', -- en_attente | recompense
  created_at timestamptz DEFAULT now()
);
