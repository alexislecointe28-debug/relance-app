export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-02-25.clover' })

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { dossier_id, facture_ids, montant_custom, description } = await req.json()

  const { data: org } = await supabase.from('organisations').select('*').single()
  if (!org?.stripe_account_id) {
    return NextResponse.json({ error: 'Compte Stripe non connecté' }, { status: 400 })
  }

  const { data: dossier } = await supabase
    .from('dossiers')
    .select('*, contact:contacts(*)')
    .eq('id', dossier_id)
    .single()

  if (!dossier) return NextResponse.json({ error: 'Dossier introuvable' }, { status: 404 })

  // Calcul du montant
  let montant = montant_custom
  if (!montant && facture_ids?.length > 0) {
    const { data: factures } = await supabase
      .from('factures')
      .select('montant_ttc')
      .in('id', facture_ids)
    montant = (factures || []).reduce((sum, f) => sum + f.montant_ttc, 0)
  }

  if (!montant || montant <= 0) {
    return NextResponse.json({ error: 'Montant invalide' }, { status: 400 })
  }

  // Créer un Payment Link via Stripe Connect
  const montantCentimes = Math.round(montant * 100)

  // Créer un produit temporaire
  const product = await stripe.products.create(
    { name: description || `Règlement — ${dossier.societe}` },
    { stripeAccount: org.stripe_account_id }
  )

  const price = await stripe.prices.create(
    { product: product.id, unit_amount: montantCentimes, currency: 'eur' },
    { stripeAccount: org.stripe_account_id }
  )

  const paymentLink = await stripe.paymentLinks.create(
    {
      line_items: [{ price: price.id, quantity: 1 }],
      metadata: {
        dossier_id,
        org_id: org.id,
        facture_ids: facture_ids?.join(',') || '',
      },
      after_completion: {
        type: 'hosted_confirmation',
        hosted_confirmation: { custom_message: `Paiement reçu. Merci de la part de ${org.nom}.` }
      },
    },
    { stripeAccount: org.stripe_account_id }
  )

  // Logger l'action
  const { data: membre } = await supabase.from('membres').select('id').eq('user_id', user.id).single()
  await supabase.from('actions').insert({
    dossier_id,
    type: 'note',
    notes: `Lien de paiement généré : ${montant.toFixed(2)} € — ${paymentLink.url}`,
    membre_id: membre?.id,
  })

  return NextResponse.json({ url: paymentLink.url, montant })
}
