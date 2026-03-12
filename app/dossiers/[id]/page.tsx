import { createServerSupabaseClient } from '@/lib/supabase-server'
import Header from '@/components/ui/Header'
import DossierClient from '@/components/dossiers/DossierClient'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function DossierPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()
  const { data: dossier } = await supabase
    .from('dossiers')
    .select('*, factures(*), contact:contacts(*), actions(*)')
    .eq('id', params.id)
    .single()
  if (!dossier) notFound()
  const contact = Array.isArray(dossier.contact) ? dossier.contact[0] : dossier.contact
  return (
    <div className="min-h-screen bg-canvas">
      <Header />
      <DossierClient dossier={{ ...dossier, contact: contact || null }} />
    </div>
  )
}
