export type StatutDossier = 'a_relancer' | 'en_attente' | 'promesse' | 'resolu'
export type StatutFacture = 'impayee' | 'contestee' | 'partiellement_payee' | 'payee'
export type TypeAction = 'appel' | 'email' | 'note' | 'import'
export type ResultatAppel = 'pas_repondu' | 'promesse_paiement' | 'conteste' | 'en_cours_traitement'
export type NiveauEmail = 'cordial' | 'ferme' | 'mise_en_demeure'

export interface Organisation {
  id: string
  nom: string
  created_at: string
}

export interface Membre {
  id: string
  user_id: string
  organisation_id: string
  nom: string | null
  prenom: string | null
  email: string | null
  role: string
  created_at: string
}

export interface Dossier {
  id: string
  organisation_id: string
  societe: string
  statut: StatutDossier
  montant_total: number
  jours_retard: number
  assigned_to: string | null
  created_at: string
  updated_at: string
  // Joined
  factures?: Facture[]
  contact?: Contact | null
  actions?: Action[]
  nb_factures?: number
}

export interface Facture {
  id: string
  dossier_id: string
  numero: string | null
  montant_ttc: number
  date_facture: string | null
  date_echeance: string | null
  statut: StatutFacture
  bon_commande: string | null
  created_at: string
}

export interface Contact {
  id: string
  dossier_id: string
  prenom: string | null
  nom: string | null
  email: string | null
  telephone: string | null
  fonction: string | null
  created_at: string
  updated_at: string
}

export interface Action {
  id: string
  dossier_id: string
  membre_id: string | null
  type: TypeAction
  resultat: ResultatAppel | null
  notes: string | null
  rappel_le: string | null
  rappel_fait: boolean
  niveau_email: NiveauEmail | null
  created_at: string
  // Joined
  membre?: Membre
}

export interface DashboardStats {
  total_montant: number
  dossiers_actifs: number
  a_relancer: number
  pct_qualifies: number
  rappels: (Action & { dossier?: Dossier })[]
}
