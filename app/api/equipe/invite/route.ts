import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  // Vérifie que l'utilisateur est admin
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data: membre } = await supabase.from('membres').select('role, organisation_id').eq('user_id', user.id).single()
  if (!membre || membre.role !== 'admin') return NextResponse.json({ error: 'Réservé aux admins' }, { status: 403 })

  const { email } = await request.json()
  if (!email) return NextResponse.json({ error: 'Email requis' }, { status: 400 })

  // Client admin avec service role key
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // Invite l'utilisateur par email
  const { data, error } = await adminClient.auth.admin.inviteUserByEmail(email)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Crée le membre dans l'organisation
  await supabase.from('membres').insert({
    user_id: data.user.id,
    organisation_id: membre.organisation_id,
    email: email,
    role: 'membre',
  })

  return NextResponse.json({ success: true })
}
