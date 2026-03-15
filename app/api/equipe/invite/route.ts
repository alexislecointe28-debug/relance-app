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

  // Vérifier la limite de collaborateurs selon le plan
  const { data: org } = await supabase
    .from('organisations')
    .select('plan')
    .eq('id', membre.organisation_id)
    .single()

  const LIMITES_COLLABS: Record<string, number> = { demo: 1, solo: 3, agence: Infinity }
  const limiteCollabs = LIMITES_COLLABS[org?.plan || 'demo'] ?? 1

  if (limiteCollabs !== Infinity) {
    const { count } = await supabase
      .from('membres')
      .select('id', { count: 'exact', head: true })
      .eq('organisation_id', membre.organisation_id)
    if ((count || 0) >= limiteCollabs) {
      return NextResponse.json({ error: 'LIMITE_COLLABS', plan: org?.plan, limite: limiteCollabs }, { status: 403 })
    }
  }

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const tempPassword = Math.random().toString(36).slice(-8) + 'A1!'

  // Créer l'utilisateur — le trigger va créer une fausse org automatiquement
  const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
  })

  if (createError) return NextResponse.json({ error: createError.message }, { status: 500 })

  const newUserId = newUser.user.id

  // Trouver et supprimer la fausse org créée par le trigger
  const { data: fakeMembre } = await adminClient
    .from('membres')
    .select('organisation_id')
    .eq('user_id', newUserId)
    .single()

  if (fakeMembre) {
    // Supprimer le faux membre
    await adminClient.from('membres').delete().eq('user_id', newUserId)
    // Supprimer la fausse organisation
    await adminClient.from('organisations').delete().eq('id', fakeMembre.organisation_id)
  }

  // Insérer le bon membre dans la bonne organisation
  await adminClient.from('membres').insert({
    user_id: newUserId,
    organisation_id: membre.organisation_id,
    email,
    role: 'membre',
  })

  return NextResponse.json({ success: true, tempPassword })
}
