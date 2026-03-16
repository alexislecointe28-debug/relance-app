export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  const { email, nom_organisation } = await req.json()
  if (!email) return NextResponse.json({ error: 'Email manquant' }, { status: 400 })

  try {
    await resend.emails.send({
      from: 'Paynelope <relance@paynelope.com>',
      to: [email],
      subject: 'Bienvenue sur Paynelope 👋',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #333;">
          <div style="background: #6366F1; padding: 32px; border-radius: 16px 16px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 800;">Paynelope</h1>
            <p style="color: #C7D2FE; margin: 8px 0 0; font-size: 14px;">Rends l'argent.</p>
          </div>
          <div style="background: white; padding: 32px; border: 1px solid #E5E7EB; border-top: none; border-radius: 0 0 16px 16px;">
            <h2 style="font-size: 20px; color: #111; margin-top: 0;">Bienvenue${nom_organisation ? ' chez ' + nom_organisation : ''} !</h2>
            <p style="color: #555; line-height: 1.6;">
              Ton espace Paynelope est prêt. Tu peux dès maintenant importer tes factures impayées et commencer à relancer tes clients.
            </p>
            <p style="color: #555; line-height: 1.6;">
              En plan Démo tu as accès à <strong>3 dossiers</strong> pour tester. Passe au plan Solo ou Agence quand tu veux.
            </p>
            <div style="margin: 24px 0; text-align: center;">
              <a href="https://paynelope.com/dashboard" 
                style="background: #6366F1; color: white; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 15px; display: inline-block;">
                Accéder à mon espace →
              </a>
            </div>
            <hr style="border: none; border-top: 1px solid #F3F4F6; margin: 24px 0;" />
            <p style="color: #9CA3AF; font-size: 12px; text-align: center;">
              Des questions ? Réponds directement à cet email.<br/>
              <a href="https://paynelope.com/legal" style="color: #9CA3AF;">CGU & Mentions légales</a>
            </p>
          </div>
        </div>
      `
    })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
