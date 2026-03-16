export const dynamic = 'force-dynamic'
import { createServerSupabaseClient, createServiceSupabaseClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createServiceSupabaseClient()

  // Récupérer l'org du membre
  const { data: membre } = await service
    .from('membres')
    .select('organisation_id')
    .eq('user_id', user.id)
    .single()

  // IP : header Vercel ou forwarded
  const ip =
    req.headers.get('x-real-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'

  const user_agent = req.headers.get('user-agent') || 'unknown'

  await service.from('connexions').insert({
    user_id: user.id,
    organisation_id: membre?.organisation_id || null,
    email: user.email,
    ip,
    user_agent,
  })

  return NextResponse.json({ ok: true })
}
