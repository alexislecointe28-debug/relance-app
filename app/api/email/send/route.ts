export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { Resend } from 'resend'

const TEMPLATES = {
  cordial: (societe: string, montant: number, signature: string) => ({
    subject: `Rappel de facture impayée — ${societe}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <p>Madame, Monsieur,</p>
        <p>Sauf erreur de notre part, nous constatons qu'une facture d'un montant de <strong>${montant.toFixed(2)} €</strong> reste à ce jour impayée.</p>
        <p>Nous vous serions reconnaissants de bien vouloir procéder au règlement de cette somme dans les meilleurs délais.</p>
        <p>Si ce règlement a déjà été effectué, veuillez ne pas tenir compte de ce message.</p>
        <p>Dans l'attente de votre retour, nous restons à votre disposition pour tout renseignement complémentaire.</p>
        <br/>
        <pre style="font-family: Arial, sans-serif; color: #555; font-size: 14px;">${signature}</pre>
      </div>
    `
  }),
  ferme: (societe: string, montant: number, signature: string) => ({
    subject: `Relance — Facture impayée ${societe} — Action requise`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <p>Madame, Monsieur,</p>
        <p>Malgré notre précédent rappel, nous constatons que la somme de <strong>${montant.toFixed(2)} €</strong> n'a toujours pas été réglée.</p>
        <p>Nous vous mettons en demeure de procéder au paiement de cette somme <strong>dans un délai de 8 jours</strong> à compter de la réception du présent courrier.</p>
        <p>À défaut, nous nous verrons contraints d'engager les procédures de recouvrement à notre disposition.</p>
        <br/>
        <pre style="font-family: Arial, sans-serif; color: #555; font-size: 14px;">${signature}</pre>
      </div>
    `
  }),
  mise_en_demeure: (societe: string, montant: number, signature: string, siret: string) => ({
    subject: `MISE EN DEMEURE — ${societe} — ${montant.toFixed(2)} €`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <p><strong>MISE EN DEMEURE</strong></p>
        <p>Madame, Monsieur,</p>
        <p>En l'absence de règlement de votre part, et après plusieurs relances restées sans suite, nous vous adressons la présente mise en demeure de régler la somme de <strong>${montant.toFixed(2)} €</strong> dans un délai de <strong>48 heures</strong>.</p>
        <p>Passé ce délai, nous engagerons sans préavis supplémentaire une procédure judiciaire de recouvrement, dont les frais vous seront intégralement imputés.</p>
        ${siret ? `<p style="color: #666; font-size: 12px;">SIRET : ${siret}</p>` : ''}
        <br/>
        <pre style="font-family: Arial, sans-serif; color: #555; font-size: 14px;">${signature}</pre>
      </div>
    `
  }),
}

export async function POST(req: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { dossier_id, niveau, email_destinataire, notes, body_override } = await req.json()

  const { data: org } = await supabase.from('organisations').select('*').single()
  const { data: dossier } = await supabase.from('dossiers').select('*').eq('id', dossier_id).single()

  if (!dossier) return NextResponse.json({ error: 'Dossier introuvable' }, { status: 404 })

  const signature = org?.signature_email || org?.nom || 'Cordialement'
  const siret = org?.siret || ''
  const fromEmail = org?.email_contact || 'onboarding@resend.dev'
  const fromName = org?.nom || 'Relance'

  const niveaux = {
    cordial: TEMPLATES.cordial(dossier.societe, dossier.montant_total, signature),
    ferme: TEMPLATES.ferme(dossier.societe, dossier.montant_total, signature),
    mise_en_demeure: TEMPLATES.mise_en_demeure(dossier.societe, dossier.montant_total, signature, siret),
  }

  const template = niveaux[niveau as keyof typeof niveaux] || niveaux.cordial

  const { data: membre } = await supabase.from('membres').select('id').eq('user_id', user.id).single()

  try {
    await resend.emails.send({
      from: `${fromName} <onboarding@resend.dev>`,
      to: [email_destinataire],
      subject: template.subject,
      html: body_override ? body_override.replace(/\n/g, "<br/>") + "<br/><br/><pre style=\"font-family:Arial;color:#555;font-size:14px;\">" + (org?.signature_email || "") + "</pre>" : template.html + (notes ? `<hr/><p style="color:#888;font-size:12px;">Note interne : ${notes}</p>` : ''),
    })

    await supabase.from('actions').insert({
      dossier_id,
      type: 'email',
      notes: `Email ${niveau} envoyé à ${email_destinataire}${notes ? ' — ' + notes : ''}`,
      membre_id: membre?.id,
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
