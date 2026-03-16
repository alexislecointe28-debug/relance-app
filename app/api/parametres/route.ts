export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function PATCH(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await req.json()
  const allowed = ['email_templates', 'signature_email', 'nom', 'email_contact', 'siret']
  const update: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) update[key] = body[key]
  }

  const { data: membre } = await supabase.from('membres').select('organisation_id, role').eq('user_id', user.id).single()
  if (!membre || membre.role !== 'admin') return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

  const { error } = await supabase.from('organisations').update(update).eq('id', membre.organisation_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
