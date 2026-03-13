import { createServerSupabaseClient } from '@/lib/supabase-server'
import Header from '@/components/ui/Header'
import ParametresClient from '@/components/parametres/ParametresClient'

export const dynamic = 'force-dynamic'

export default async function ParametresPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: membre } = await supabase.from('membres').select('*').eq('user_id', user?.id).single()
  const { data: org } = await supabase.from('organisations').select('*').single()

  return (
    <div className="min-h-screen bg-canvas">
      <Header />
      <ParametresClient membre={membre as any} org={org as any} />
    </div>
  )
}
