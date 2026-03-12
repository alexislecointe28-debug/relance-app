import { createServerSupabaseClient } from '@/lib/supabase-server'
import Header from '@/components/ui/Header'
import EquipeClient from '@/components/equipe/EquipeClient'

export const dynamic = 'force-dynamic'

export default async function EquipePage() {
  const supabase = createServerSupabaseClient()
  const { data: membres } = await supabase.from('membres').select('*').order('created_at', { ascending: true })
  const { data: org } = await supabase.from('organisations').select('nom').single()

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <EquipeClient membres={(membres || []) as any} orgNom={org?.nom || ''} />
    </div>
  )
}
