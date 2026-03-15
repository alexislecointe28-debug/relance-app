import { createServerSupabaseClient } from '@/lib/supabase-server'
import Header from '@/components/ui/Header'
import DossiersClient from '@/components/dossiers/DossiersClient'

export const dynamic = 'force-dynamic'

export default async function DossiersPage() {
  const supabase = createServerSupabaseClient()

  const { data: dossiers } = await supabase
    .from('dossiers')
    .select('*, factures(id), actions(id, type, created_at), assignee:membres!dossiers_assigned_to_fkey(id, prenom, nom, email)')
    .order('jours_retard', { ascending: false })

  const dossiersWithCount = (dossiers || []).map(d => ({
    ...d,
    nb_factures: (d.factures as any[])?.length || 0,
    nb_actions: (d.actions as any[])?.length || 0,
    derniere_action: (d.actions as any[])?.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]?.created_at || null,
    factures: undefined,
    actions: undefined,
  }))

  return (
    <div className="min-h-screen bg-canvas">
      <Header />
      <DossiersClient dossiers={dossiersWithCount as any} />
    </div>
  )
}
