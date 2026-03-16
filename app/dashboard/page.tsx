import { createServerSupabaseClient } from '@/lib/supabase-server'
import Header, { DemoBanner } from '@/components/ui/Header'
import DashboardClient from '@/components/dashboard/DashboardClient'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = createServerSupabaseClient()

  const { data: org } = await supabase.from('organisations').select('plan').single()
  const plan = org?.plan || 'demo'

  // Récupérer le membre courant pour filtrage agence
  const { data: currentMembre } = await supabase.from('membres').select('id, role').single()
  const isAdmin = currentMembre?.role === 'admin'

  let dossierQuery = supabase
    .from('dossiers')
    .select('*, contact:contacts(id, prenom, nom, email, telephone, fonction), factures(id), assignee:membres!dossiers_assigned_to_fkey(id, prenom, nom, email)')
    .is('archived_at', null)
    .order('jours_retard', { ascending: false })

  // Plan agence + collab : seulement ses dossiers assignés
  if (plan === 'agence' && !isAdmin && currentMembre?.id) {
    dossierQuery = dossierQuery.eq('assigned_to', currentMembre.id)
  }

  const { data: dossiers } = await dossierQuery

  const today = new Date()
  const j7 = new Date(today)
  j7.setDate(j7.getDate() + 7)

  const { data: feed } = await supabase
    .from('actions')
    .select('id, type, notes, created_at, niveau_email, dossier:dossiers(id, societe), membre:membres(prenom, nom)')
    .order('created_at', { ascending: false })
    .limit(10)

  const { data: rappels } = await supabase
    .from('actions')
    .select('*, dossier:dossiers(id, societe, montant_total, statut)')
    .eq('rappel_fait', false)
    .not('rappel_le', 'is', null)
    .lte('rappel_le', j7.toISOString().split('T')[0])
    .order('rappel_le', { ascending: true })
    .limit(20)

  const dossiersWithCount = (dossiers || []).map(d => ({
    ...d,
    nb_factures: (d.factures as any[])?.length || 0,
    factures: undefined,
    // Garder le contact avec tous ses champs (Supabase retourne un tableau)
    contact: Array.isArray(d.contact) ? (d.contact[0] || null) : (d.contact || null),
  }))

  const total_montant = dossiersWithCount.reduce((s, d) => s + (d.montant_total || 0), 0)
  const dossiers_actifs = dossiersWithCount.filter(d => d.statut !== 'resolu').length
  const a_relancer = dossiersWithCount.filter(d => d.statut === 'a_relancer').length
  const avec_contact = dossiersWithCount.filter(d => d.contact).length
  const pct_qualifies = dossiersWithCount.length > 0 ? Math.round((avec_contact / dossiersWithCount.length) * 100) : 0

  // Stats pour la checklist onboarding
  const { count: actionsCount } = await supabase
    .from('actions')
    .select('id', { count: 'exact', head: true })

  const hasImported = dossiersWithCount.length > 0
  const hasIdentified = avec_contact > 0
  const hasRelanced = (actionsCount || 0) > 0

  return (
    <div className="min-h-screen bg-canvas">
      <Header />
      <DemoBanner plan={plan} />
      <DashboardClient
        dossiers={dossiersWithCount as any}
        rappels={(rappels || []) as any}
        feed={(feed || []) as any}
        stats={{ total_montant, dossiers_actifs, a_relancer, pct_qualifies }}
        onboarding={{ hasImported, hasIdentified, hasRelanced }}
      />
    </div>
  )
}
