import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { NextResponse } from 'next/server'

const resend = new Resend(process.env.RESEND_API_KEY)

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

  // Créer l'utilisateur via Supabase Admin
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // Générer un mot de passe temporaire
  const tempPassword = Math.random().toString(36).slice(-10) + 'A1!'

  const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
  })

  if (createError) return NextResponse.json({ error: createError.message }, { status: 500 })

  // Ajouter le membre à l'organisation
  await supabase.from('membres').insert({
    user_id: newUser.user.id,
    organisation_id: membre.organisation_id,
    email,
    role: 'membre',
  })

  // Récupérer le nom de l'organisation
  const { data: org } = await supabase
    .from('organisations')
    .select('nom')
    .eq('id', membre.organisation_id)
    .single()

  // Envoyer l'email via Resend
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://relance-app.vercel.app'

  const { error: emailError } = await resend.emails.send({
    from: 'Relance <onboarding@resend.dev>',
    to: email,
    subject: `Invitation à rejoindre ${org?.nom || 'Relance'}`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #111;">
        <div style="margin-bottom: 32px;">
          <div style="width: 40px; height: 40px; background: #2563eb; border-radius: 10px; display: flex; align-items: center; justify-content: center; margin-bottom: 16px;">
            <span style="color: white; font-size: 20px;">≡</span>
          </div>
          <h1 style="font-size: 22px; font-weight: 700; margin: 0 0 8px;">Vous êtes invité sur Relance</h1>
          <p style="color: #6b7280; margin: 0;">Vous avez été ajouté à l'organisation <strong>${org?.nom || 'Relance'}</strong>.</p>
        </div>

        <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; margin-bottom: 28px;">
          <p style="margin: 0 0 4px; font-size: 13px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">Vos identifiants</p>
          <p style="margin: 8px 0 4px;"><strong>Email :</strong> ${email}</p>
          <p style="margin: 4px 0;"><strong>Mot de passe temporaire :</strong> <code style="background: #e5e7eb; padding: 2px 6px; border-radius: 4px;">${tempPassword}</code></p>
        </div>

        <a href="${appUrl}/login" style="display: block; background: #2563eb; color: white; text-align: center; padding: 14px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 15px; margin-bottom: 20px;">
          Accéder à l'application →
        </a>

        <p style="color: #9ca3af; font-size: 13px; text-align: center; margin: 0;">
          Pensez à changer votre mot de passe après votre première connexion.
        </p>
      </div>
    `,
  })

  if (emailError) return NextResponse.json({ error: 'Utilisateur créé mais email non envoyé : ' + emailError.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
