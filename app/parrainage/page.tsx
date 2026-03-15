import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Header from '@/components/ui/Header'
import ParrainageClient from '@/components/parrainage/ParrainageClient'

export const dynamic = 'force-dynamic'

export default async function ParrainagePage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: org } = await supabase.from('organisations').select('id, nom').single()
  const codeParrainage = org?.id?.slice(0, 8).toUpperCase() || 'XXXXXXXX'
  const lienParrainage = `https://relance-app.vercel.app/signup?ref=${codeParrainage}`

  return (
    <div className="min-h-screen bg-canvas">
      <Header />
      <ParrainageClient lienParrainage={lienParrainage} />
    </div>
  )
}
