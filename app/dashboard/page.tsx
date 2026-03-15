import { createServerSupabaseClient } from '@/lib/supabase-server'
import Header, { DemoBanner } from '@/components/ui/Header'
import DashboardClient from '@/components/dashboard/DashboardClient'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = createServerSupabaseClient()

  const { data: org } = await supabase.from('organisations').select('plan').single()
  const plan = org?.plan || 'demo'

  const { data: dossiers } = await supabase
    .from('dossiers')
    .select('*, contact:contacts(id), factures(id)')
    .is('archived_at', null)
    .order('jours_retard', { ascending: false })

  const today = new Date()
  const j7 = new Date(today)
  j7.setDate(j7.getDate() + 7)

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
    contact: undefined,
  }))

  const total_montant = dossiersWithCount.reduce((s, d) => s + (d.montant_total || 0), 0)
  const dossiers_actifs = dossiersWithCount.filter(d => d.statut !== 'resolu').length
  const a_relancer = dossiersWithCount.filter(d => d.statut === 'a_relancer').length
  const avec_contact = (dossiers || []).filter(d => d.contact && (d.contact as any[]).length > 0).length
  const pct_qualifies = dossiersWithCount.length > 0 ? Math.round((avec_contact / dossiersWithCount.length) * 100) : 0

  return (
    <div className="min-h-screen bg-canvas">
      <Header />
      <DemoBanner plan={plan} />
      <DashboardClient
        dossiers={dossiersWithCount as any}
        rappels={(rappels || []) as any}
        stats={{ total_montant, dossiers_actifs, a_relancer, pct_qualifies }}
      />
    </div>
  )
}
