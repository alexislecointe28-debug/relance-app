CREATE TABLE IF NOT EXISTS connexions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  organisation_id uuid REFERENCES organisations(id) ON DELETE CASCADE,
  email text,
  ip text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Index pour les requêtes admin
CREATE INDEX IF NOT EXISTS connexions_org_id_idx ON connexions(organisation_id);
CREATE INDEX IF NOT EXISTS connexions_created_at_idx ON connexions(created_at DESC);

-- RLS : superadmin uniquement via service role
ALTER TABLE connexions ENABLE ROW LEVEL SECURITY;
