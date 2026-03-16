export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { Resend } from 'resend'

const TEMPLATES = {
  cordial: (societe: string, montant: number, signature: string, facturesHtml: string) => ({
    subject: `Règlement en attente — ${societe}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <p>Madame, Monsieur,</p>
        <p>Sauf erreur de notre part, nous constatons qu'une facture d'un montant de <strong>${montant.toFixed(2)} €</strong> reste à ce jour impayée.</p>
        ${facturesHtml}
        <p>Nous vous serions reconnaissants de bien vouloir procéder au règlement de cette somme dans les meilleurs délais.</p>
        <p>Si ce règlement a déjà été effectué, veuillez ne pas tenir compte de ce message.</p>
        <p>Dans l'attente de votre retour, nous restons à votre disposition pour tout renseignement complémentaire.</p>
        <br/>
        <pre style="font-family: Arial, sans-serif; color: #555; font-size: 14px;">${signature}</pre>
      </div>
    `
  }),
  ferme: (societe: string, montant: number, signature: string, facturesHtml: string) => ({
    subject: `Rappel important — ${societe}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <p>Madame, Monsieur,</p>
        <p>Malgré notre précédent rappel, nous constatons que la somme de <strong>${montant.toFixed(2)} €</strong> n'a toujours pas été réglée.</p>
        ${facturesHtml}
        <p>Nous vous demandons de procéder au paiement dans un délai de 8 jours à compter de la réception de ce message.</p>
        <p>À défaut, nous nous verrons contraints d'engager les procédures de recouvrement à notre disposition.</p>
        <br/>
        <pre style="font-family: Arial, sans-serif; color: #555; font-size: 14px;">${signature}</pre>
      </div>
    `
  }),
  mise_en_demeure: (societe: string, montant: number, signature: string, siret: string, facturesHtml: string) => ({
    subject: `Dernier rappel avant procédure — ${societe}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <p><strong>MISE EN DEMEURE</strong></p>
        <p>Madame, Monsieur,</p>
        <p>En l'absence de règlement de votre part, et après plusieurs relances restées sans suite, nous vous adressons la présente mise en demeure de régler la somme de <strong>${montant.toFixed(2)} €</strong> dans un délai de <strong>48 heures</strong>.</p>
        ${facturesHtml}
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
  const { data: factures } = await supabase
    .from('factures')
    .select('numero, montant_ttc, date_echeance, statut')
    .eq('dossier_id', dossier_id)
    .neq('statut', 'payee')
    .order('date_echeance', { ascending: true })

  if (!dossier) return NextResponse.json({ error: 'Dossier introuvable' }, { status: 404 })

  // Liste des factures impayées formatée pour l'email
  const facturesHtml = factures && factures.length > 0
    ? `<table style="width:100%;border-collapse:collapse;margin:12px 0;font-size:13px;">
        <thead>
          <tr style="background:#f5f5f5;">
            <th style="text-align:left;padding:6px 10px;border:1px solid #e0e0e0;">N° Facture</th>
            <th style="text-align:right;padding:6px 10px;border:1px solid #e0e0e0;">Montant TTC</th>
            <th style="text-align:right;padding:6px 10px;border:1px solid #e0e0e0;">Échéance</th>
          </tr>
        </thead>
        <tbody>
          ${factures.map(f => `
          <tr>
            <td style="padding:6px 10px;border:1px solid #e0e0e0;">${f.numero || '—'}</td>
            <td style="text-align:right;padding:6px 10px;border:1px solid #e0e0e0;font-weight:600;">${f.montant_ttc.toFixed(2)} €</td>
            <td style="text-align:right;padding:6px 10px;border:1px solid #e0e0e0;color:#888;">${f.date_echeance ? new Date(f.date_echeance).toLocaleDateString('fr-FR') : '—'}</td>
          </tr>`).join('')}
          <tr style="background:#fafafa;">
            <td style="padding:6px 10px;border:1px solid #e0e0e0;font-weight:bold;">Total</td>
            <td style="text-align:right;padding:6px 10px;border:1px solid #e0e0e0;font-weight:bold;">${factures.reduce((s, f) => s + f.montant_ttc, 0).toFixed(2)} €</td>
            <td style="border:1px solid #e0e0e0;"></td>
          </tr>
        </tbody>
      </table>`
    : ''

  const signature = org?.signature_email || org?.nom || 'Cordialement'
  const siret = org?.siret || ''
  const fromEmail = org?.email_contact || 'relance@paynelope.com'
  const fromName = org?.nom || 'Relance'

  // Templates custom si définis, sinon defaults
  const customTemplates = org?.email_templates || {}

  function buildHtml(body: string) {
    return `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      ${body.split('\n').map((l: string) => l ? `<p>${l}</p>` : '<br/>').join('')}
      <pre style="font-family: Arial, sans-serif; color: #555; font-size: 14px;">${signature}</pre>
    </div>`
  }

  const niveaux = {
    cordial: customTemplates.cordial
      ? { subject: `Règlement en attente — ${dossier.societe}`, html: buildHtml(customTemplates.cordial.replace(/{societe}/g, dossier.societe).replace(/{montant}/g, dossier.montant_total.toFixed(2))) + facturesHtml }
      : TEMPLATES.cordial(dossier.societe, dossier.montant_total, signature, facturesHtml),
    ferme: customTemplates.ferme
      ? { subject: `Rappel important — ${dossier.societe}`, html: buildHtml(customTemplates.ferme.replace(/{societe}/g, dossier.societe).replace(/{montant}/g, dossier.montant_total.toFixed(2))) + facturesHtml }
      : TEMPLATES.ferme(dossier.societe, dossier.montant_total, signature, facturesHtml),
    mise_en_demeure: customTemplates.mise_en_demeure
      ? { subject: `Dernier rappel avant procédure — ${dossier.societe}`, html: buildHtml(customTemplates.mise_en_demeure.replace(/{societe}/g, dossier.societe).replace(/{montant}/g, dossier.montant_total.toFixed(2))) + facturesHtml }
      : TEMPLATES.mise_en_demeure(dossier.societe, dossier.montant_total, signature, siret, facturesHtml),
  }

  const template = niveaux[niveau as keyof typeof niveaux] || niveaux.cordial

  const { data: membre } = await supabase.from('membres').select('id').eq('user_id', user.id).single()

  try {
    const { data: emailData } = await resend.emails.send({
      from: `${fromName} <relance@paynelope.com>`,
      to: [email_destinataire],
      subject: template.subject,
      html: body_override ? body_override.replace(/\n/g, "<br/>") + "<br/><br/><pre style=\"font-family:Arial;color:#555;font-size:14px;\">" + (org?.signature_email || "") + "</pre>" : template.html + (notes ? `<hr/><p style="color:#888;font-size:12px;">Note interne : ${notes}</p>` : ''),
    })

    await supabase.from('actions').insert({
      dossier_id,
      type: 'email',
      niveau_email: niveau,
      notes: `Email ${niveau} envoyé à ${email_destinataire}${notes ? ' — ' + notes : ''}`,
      membre_id: membre?.id,
      resend_email_id: emailData?.id || null,
      email_status: 'sent',
    })

    // Si email saisi manuellement → mettre à jour le contact du dossier
    if (email_destinataire) {
      const { data: contact } = await supabase
        .from('contacts')
        .select('id, email')
        .eq('dossier_id', dossier_id)
        .single()

      if (contact && !contact.email) {
        // Contact existe sans email → on complète
        await supabase.from('contacts').update({ email: email_destinataire }).eq('id', contact.id)
      } else if (!contact) {
        // Pas de contact → on crée avec juste l'email
        await supabase.from('contacts').insert({ dossier_id, email: email_destinataire })
      }
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
