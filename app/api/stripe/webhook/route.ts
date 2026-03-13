export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-01-27.acacia' })

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
