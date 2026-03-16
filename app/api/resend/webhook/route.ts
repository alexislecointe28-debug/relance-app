export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const STATUS_MAP: Record<string, string> = {
  'email.sent':       'sent',
  'email.delivered':  'delivered',
  'email.opened':     'opened',
  'email.clicked':    'clicked',
  'email.bounced':    'bounced',
  'email.complained': 'complained',
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const eventType = body?.type
  const emailId = body?.data?.email_id

  if (!emailId || !STATUS_MAP[eventType]) {
    return NextResponse.json({ received: true })
  }

  const newStatus = STATUS_MAP[eventType]

  // Priorité des statuts — on ne régresse pas
  const PRIORITY: Record<string, number> = {
    sent: 1, delivered: 2, opened: 3, clicked: 4, bounced: 5, complained: 5
  }

  const { data: action } = await supabase
    .from('actions')
    .select('id, email_status')
    .eq('resend_email_id', emailId)
    .single()

  if (!action) return NextResponse.json({ received: true })

  const currentPriority = PRIORITY[action.email_status] || 0
  const newPriority = PRIORITY[newStatus] || 0

  // Ne pas rétrograder (ex: opened → delivered)
  if (newPriority > currentPriority) {
    await supabase
      .from('actions')
      .update({ email_status: newStatus })
      .eq('id', action.id)
  }

  return NextResponse.json({ received: true })
}
