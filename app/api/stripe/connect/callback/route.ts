export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-02-25.clover' })

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const orgId = searchParams.get('state')

  if (!code || !orgId) {
    return NextResponse.redirect(new URL('/parametres?connect=error', req.url))
  }

  try {
    const response = await stripe.oauth.token({ grant_type: 'authorization_code', code })
    const stripeAccountId = response.stripe_user_id

    const supabase = createServerSupabaseClient()
    await supabase
      .from('organisations')
      .update({ stripe_account_id: stripeAccountId })
      .eq('id', orgId)

    return NextResponse.redirect(new URL('/parametres?connect=success', req.url))
  } catch {
    return NextResponse.redirect(new URL('/parametres?connect=error', req.url))
  }
}
