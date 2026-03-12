-- RelanceApp - Schéma Supabase
-- Run this in your Supabase SQL editor

-- Enable RLS
create extension if not exists "uuid-ossp";

-- Organisations
create table if not exists organisations (
  id uuid primary key default uuid_generate_v4(),
  nom text not null,
  created_at timestamptz default now()
);

-- Membres (liés à auth.users)
create table if not exists membres (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  organisation_id uuid references organisations(id) on delete cascade,
  nom text,
  prenom text,
  email text,
  role text default 'membre',
  created_at timestamptz default now()
);

-- Dossiers (regroupement de factures par société)
create table if not exists dossiers (
  id uuid primary key default uuid_generate_v4(),
  organisation_id uuid references organisations(id) on delete cascade,
  societe text not null,
  statut text default 'a_relancer' check (statut in ('a_relancer','en_attente','promesse','resolu')),
  montant_total numeric(12,2) default 0,
  jours_retard integer default 0,
  assigned_to uuid references membres(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Factures
create table if not exists factures (
  id uuid primary key default uuid_generate_v4(),
  dossier_id uuid references dossiers(id) on delete cascade,
  numero text,
  montant_ttc numeric(12,2),
  date_facture date,
  date_echeance date,
  statut text default 'impayee' check (statut in ('impayee','contestee','partiellement_payee','payee')),
  bon_commande text,
  created_at timestamptz default now()
);

-- Contacts (comptabilité côté débiteur)
create table if not exists contacts (
  id uuid primary key default uuid_generate_v4(),
  dossier_id uuid references dossiers(id) on delete cascade unique,
  prenom text,
  nom text,
  email text,
  telephone text,
  fonction text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Actions (timeline)
create table if not exists actions (
  id uuid primary key default uuid_generate_v4(),
  dossier_id uuid references dossiers(id) on delete cascade,
  membre_id uuid references membres(id),
  type text not null check (type in ('appel','email','note','import')),
  resultat text check (resultat in ('pas_repondu','promesse_paiement','conteste','en_cours_traitement', null)),
  notes text,
  rappel_le date,
  rappel_fait boolean default false,
  niveau_email text check (niveau_email in ('cordial','ferme','mise_en_demeure', null)),
  created_at timestamptz default now()
);

-- Index pour performances
create index if not exists idx_dossiers_org on dossiers(organisation_id);
create index if not exists idx_dossiers_statut on dossiers(statut);
create index if not exists idx_factures_dossier on factures(dossier_id);
create index if not exists idx_actions_dossier on actions(dossier_id);
create index if not exists idx_actions_rappel on actions(rappel_le) where rappel_fait = false;
create index if not exists idx_membres_user on membres(user_id);

-- RLS Policies
alter table organisations enable row level security;
alter table membres enable row level security;
alter table dossiers enable row level security;
alter table factures enable row level security;
alter table contacts enable row level security;
alter table actions enable row level security;

-- Helper function: get user's org
create or replace function get_user_org_id()
returns uuid as $$
  select organisation_id from membres where user_id = auth.uid() limit 1;
$$ language sql security definer;

-- Policies organisations
create policy "org_select" on organisations for select using (id = get_user_org_id());
create policy "org_update" on organisations for update using (id = get_user_org_id());

-- Policies membres
create policy "membres_select" on membres for select using (organisation_id = get_user_org_id());
create policy "membres_insert" on membres for insert with check (organisation_id = get_user_org_id());

-- Policies dossiers
create policy "dossiers_select" on dossiers for select using (organisation_id = get_user_org_id());
create policy "dossiers_insert" on dossiers for insert with check (organisation_id = get_user_org_id());
create policy "dossiers_update" on dossiers for update using (organisation_id = get_user_org_id());
create policy "dossiers_delete" on dossiers for delete using (organisation_id = get_user_org_id());

-- Policies factures
create policy "factures_select" on factures for select using (
  dossier_id in (select id from dossiers where organisation_id = get_user_org_id())
);
create policy "factures_insert" on factures for insert with check (
  dossier_id in (select id from dossiers where organisation_id = get_user_org_id())
);
create policy "factures_update" on factures for update using (
  dossier_id in (select id from dossiers where organisation_id = get_user_org_id())
);

-- Policies contacts
create policy "contacts_select" on contacts for select using (
  dossier_id in (select id from dossiers where organisation_id = get_user_org_id())
);
create policy "contacts_insert" on contacts for insert with check (
  dossier_id in (select id from dossiers where organisation_id = get_user_org_id())
);
create policy "contacts_update" on contacts for update using (
  dossier_id in (select id from dossiers where organisation_id = get_user_org_id())
);

-- Policies actions
create policy "actions_select" on actions for select using (
  dossier_id in (select id from dossiers where organisation_id = get_user_org_id())
);
create policy "actions_insert" on actions for insert with check (
  dossier_id in (select id from dossiers where organisation_id = get_user_org_id())
);
create policy "actions_update" on actions for update using (
  dossier_id in (select id from dossiers where organisation_id = get_user_org_id())
);

-- Function to recalculate dossier totals
create or replace function recalc_dossier(p_dossier_id uuid)
returns void as $$
  update dossiers d set
    montant_total = coalesce((
      select sum(montant_ttc) from factures 
      where dossier_id = p_dossier_id and statut != 'payee'
    ), 0),
    jours_retard = coalesce((
      select max(current_date - date_echeance) from factures
      where dossier_id = p_dossier_id and statut = 'impayee' and date_echeance < current_date
    ), 0),
    updated_at = now()
  where id = p_dossier_id;
$$ language sql;

-- Trigger to update dossier on facture change
create or replace function trigger_recalc_dossier()
returns trigger as $$
begin
  perform recalc_dossier(coalesce(new.dossier_id, old.dossier_id));
  return new;
end;
$$ language plpgsql;

create trigger factures_recalc
after insert or update or delete on factures
for each row execute function trigger_recalc_dossier();

-- Signup trigger: create org + membre automatiquement
create or replace function handle_new_user()
returns trigger as $$
declare
  new_org_id uuid;
begin
  -- Créer une organisation par défaut
  insert into organisations (nom) values ('Mon organisation')
  returning id into new_org_id;
  
  -- Créer un membre lié
  insert into membres (user_id, organisation_id, email, role)
  values (new.id, new_org_id, new.email, 'admin');
  
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function handle_new_user();
