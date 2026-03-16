export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-02-25.clover' })

const PLAN_BY_PRICE: Record<string, string> = {
  'price_1TAdVIABFeUjrBZzvroWD2UM': 'solo',
  'price_1TAdXfABFeUjrBZzSB0SOSKs': 'agence',
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const orgId = session.metadata?.org_id
    const plan = session.metadata?.plan
    if (orgId && plan) {
      await supabase.from('organisations').update({
        plan,
        stripe_subscription_id: session.subscription as string,
      }).eq('id', orgId)

      // Vérifier si parrainage en attente
      const { data: parrainage } = await supabase
        .from('parrainages')
        .select('*, parrain:parrain_org_id(stripe_subscription_id, stripe_customer_id)')
        .eq('filleul_org_id', orgId)
        .eq('statut', 'en_attente')
        .single()

      if (parrainage && session.customer && session.subscription) {
        // Appliquer au filleul via invoice item crédit
        await stripe.invoiceItems.create({
          customer: session.customer as string,
          amount: -4900,
          currency: 'eur',
          description: 'Mois offert — Bienvenue sur Paynelope 🎁',
        }).catch(() => {})

        // Appliquer au parrain si abonnement actif
        const parrainOrg = parrainage.parrain as any
        if (parrainOrg?.stripe_customer_id) {
          await stripe.invoiceItems.create({
            customer: parrainOrg.stripe_customer_id,
            amount: -4900,
            currency: 'eur',
            description: 'Mois offert — Tu as parrainé un ami 🎁',
          }).catch(() => {})
        }

        // Marquer comme récompensé
        await supabase.from('parrainages').update({ statut: 'recompense' }).eq('id', parrainage.id)
      }
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object as Stripe.Subscription
    await supabase.from('organisations')
      .update({ plan: 'demo', stripe_subscription_id: null })
      .eq('stripe_subscription_id', sub.id)
  }

  if (event.type === 'customer.subscription.updated') {
    const sub = event.data.object as Stripe.Subscription
    const priceId = sub.items.data[0]?.price.id
    const plan = PLAN_BY_PRICE[priceId] || 'demo'
    await supabase.from('organisations')
      .update({ plan })
      .eq('stripe_subscription_id', sub.id)
  }

  return NextResponse.json({ received: true })
}
