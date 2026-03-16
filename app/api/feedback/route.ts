export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { type, message, email } = await req.json()
  if (!message?.trim()) return NextResponse.json({ error: 'Message vide' }, { status: 400 })

  const typeLabels: Record<string, string> = {
    bug: '🐛 Bug',
    idee: '💡 Idée',
    question: '❓ Question',
  }

  try {
    await resend.emails.send({
      from: 'Paynelope <relance@paynelope.com>',
      to: ['contact@paynelope.com'],
      replyTo: email || user?.email || undefined,
      subject: `[Feedback] ${typeLabels[type] || type} — ${email || user?.email || 'Anonyme'}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px;">
          <h2 style="color: #6366F1;">${typeLabels[type] || type}</h2>
          <p><strong>De :</strong> ${email || user?.email || 'Non renseigné'}</p>
          <hr/>
          <p style="white-space: pre-wrap;">${message}</p>
        </div>
      `
    })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
