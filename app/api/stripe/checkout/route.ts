export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-01-27.acacia' })

const PRICE_IDS = {
  solo: 'price_1TAdVIABFeUjrBZzvroWD2UM',
  agence: 'price_1TAdXfABFeUjrBZzSB0SOSKs',
}

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { plan } = await req.json()
  const priceId = PRICE_IDS[plan as keyof typeof PRICE_IDS]
  if (!priceId) return NextResponse.json({ error: 'Plan invalide' }, { status: 400 })

  const { data: org } = await supabase.from('organisations').select('*').single()
  if (!org) return NextResponse.json({ error: 'Organisation introuvable' }, { status: 404 })

  // Créer ou récupérer le customer Stripe
  let customerId = org.stripe_customer_id
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { org_id: org.id },
    })
    customerId = customer.id
    await supabase.from('organisations').update({ stripe_customer_id: customerId }).eq('id', org.id)
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    mode: 'subscription',
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/?checkout=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?checkout=cancelled`,
    metadata: { org_id: org.id, plan },
  })

  return NextResponse.json({ url: session.url })
}
