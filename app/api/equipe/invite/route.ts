import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data: membre } = await supabase
    .from('membres')
    .select('role, organisation_id')
    .eq('user_id', user.id)
    .single()

  if (!membre || membre.role !== 'admin') {
    return NextResponse.json({ error: 'Réservé aux admins' }, { status: 403 })
  }

  const { email } = await request.json()
  if (!email) return NextResponse.json({ error: 'Email requis' }, { status: 400 })

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const tempPassword = Math.random().toString(36).slice(-8) + 'A1!'

  const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
  })

  if (createError) return NextResponse.json({ error: createError.message }, { status: 500 })

  await supabase.from('membres').insert({
    user_id: newUser.user.id,
    organisation_id: membre.organisation_id,
    email,
    role: 'membre',
  })

  // Retourne le mot de passe pour l'afficher dans l'UI
  return NextResponse.json({ success: true, tempPassword })
}
