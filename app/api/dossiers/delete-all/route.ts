import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'

export async function DELETE(req: NextRequest) {
  const supabase = createServerSupabaseClient(cookies())
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const { data: membre } = await supabase.from('membres').select('organisation_id').eq('user_id', user.id).single()
  if (!membre) return NextResponse.json({ error: 'Organisation introuvable' }, { status: 404 })
  const { error } = await supabase.from('dossiers').delete().eq('organisation_id', membre.organisation_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
