import { createServerSupabaseClient } from '@/lib/supabase-server'
import Header from '@/components/ui/Header'
import { notFound } from 'next/navigation'
import AssignationsClient from '@/components/equipe/AssignationsClient'

export const dynamic = 'force-dynamic'

export default async function AssignationsPage() {
  const supabase = createServerSupabaseClient()

  const { data: currentMembre } = await supabase.from('membres').select('id, role').single()
  const { data: org } = await supabase.from('organisations').select('plan').single()

  // Accessible à tous les admins — pas seulement agence (pour les tests)
  if (currentMembre?.role !== 'admin') notFound()

  const { data: dossiers } = await supabase
    .from('dossiers')
    .select('id, societe, montant_total, jours_retard, statut, assigned_to, assignee:membres!dossiers_assigned_to_fkey(id, prenom, nom, email)')
    .is('archived_at', null)
    .order('jours_retard', { ascending: false })

  const { data: membres } = await supabase
    .from('membres')
    .select('id, prenom, nom, email, role')
    .order('prenom')

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <AssignationsClient
        dossiers={(dossiers || []) as any}
        membres={(membres || []) as any}
      />
    </div>
  )
}
