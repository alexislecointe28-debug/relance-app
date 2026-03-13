export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const { email, password, nom_organisation } = await req.json()

  if (!email || !password || !nom_organisation) {
    return NextResponse.json({ error: 'Champs manquants' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (authError || !authData.user) {
    return NextResponse.json({ error: authError?.message || 'Erreur création compte' }, { status: 400 })
  }

  const userId = authData.user.id

  const { data: org, error: orgError } = await supabase
    .from('organisations')
    .insert({ nom: nom_organisation })
    .select()
    .single()

  if (orgError || !org) {
    await supabase.auth.admin.deleteUser(userId)
    return NextResponse.json({ error: 'Erreur création organisation' }, { status: 500 })
  }

  const { error: membreError } = await supabase
    .from('membres')
    .insert({ user_id: userId, organisation_id: org.id, email, role: 'admin', prenom: '', nom: '' })

  if (membreError) {
    await supabase.auth.admin.deleteUser(userId)
    await supabase.from('organisations').delete().eq('id', org.id)
    return NextResponse.json({ error: 'Erreur création membre' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
