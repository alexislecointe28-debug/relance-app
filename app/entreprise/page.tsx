import { createServerSupabaseClient } from '@/lib/supabase-server'
import Header from '@/components/ui/Header'
import EntrepriseClient from '@/components/entreprise/EntrepriseClient'

export const dynamic = 'force-dynamic'

export default async function EntreprisePage() {
  const supabase = createServerSupabaseClient()
  const { data: org } = await supabase.from('organisations').select('*').single()
  return (
    <div className="min-h-screen bg-canvas">
      <Header />
      <EntrepriseClient org={org as any} />
    </div>
  )
}
