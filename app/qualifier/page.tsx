import { createServerSupabaseClient } from '@/lib/supabase-server'
import QualifierClient from '@/components/qualifier/QualifierClient'
import Header from '@/components/ui/Header'

export const dynamic = 'force-dynamic'

export default async function QualifierPage() {
  const supabase = createServerSupabaseClient()
  const { data: dossiers } = await supabase
    .from('dossiers')
    .select('id, societe, montant_total, jours_retard, statut, contact:contacts(id, prenom, nom, email, telephone, fonction)')
    .neq('statut', 'resolu')
    .order('montant_total', { ascending: false })

  const withoutContact = (dossiers || []).filter(d => !d.contact || (d.contact as any[]).length === 0)
  const withContact = (dossiers || []).filter(d => d.contact && (d.contact as any[]).length > 0)
  const sorted = [...withoutContact, ...withContact]

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <Header />
      <QualifierClient dossiers={sorted as any} />
    </div>
  )
}
