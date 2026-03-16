import { createServerSupabaseClient } from '@/lib/supabase-server'
import Header from '@/components/ui/Header'
import DossierClient from '@/components/dossiers/DossierClient'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function DossierPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()
  const { data: dossier } = await supabase
    .from('dossiers')
    .select('*, factures(*), contact:contacts(*), actions(*, membre:membres(prenom, nom)), assignee:membres!dossiers_assigned_to_fkey(id, prenom, nom, email)')
    .eq('id', params.id)
    .single()
  if (!dossier) notFound()

  const { data: currentMembre } = await supabase.from('membres').select('id, role').single()
  const { data: org } = await supabase.from('organisations').select('plan, stripe_account_id').single()
  const { data: membres } = await supabase.from('membres').select('id, prenom, nom, email').order('prenom')

  const contact = Array.isArray(dossier.contact) ? dossier.contact[0] : dossier.contact
  const assignee = Array.isArray(dossier.assignee) ? dossier.assignee[0] : dossier.assignee

  return (
    <div className="min-h-screen bg-canvas">
      <Header />
      <DossierClient
        dossier={{ ...dossier, contact: contact || null, assignee: assignee || null }}
        membres={membres || []}
        isAdmin={currentMembre?.role === 'admin'}
        plan={org?.plan || 'demo'}
        stripeConnected={!!org?.stripe_account_id}
      />
    </div>
  )
}
