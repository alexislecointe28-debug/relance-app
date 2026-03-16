export const dynamic = 'force-dynamic'
import { createServerSupabaseClient, createServiceSupabaseClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

async function checkSuperadmin() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { data: membre } = await supabase
    .from('membres')
    .select('superadmin')
    .eq('user_id', user.id)
    .single()
  return membre?.superadmin === true
}

export async function POST(req: NextRequest) {
  const isSuperadmin = await checkSuperadmin()
  if (!isSuperadmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { action, user_id, org_id, password, blocked } = await req.json()
  const service = createServiceSupabaseClient()

  if (action === 'update_password') {
    const { error } = await service.auth.admin.updateUserById(user_id, { password })
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ ok: true })
  }

  if (action === 'toggle_block') {
    const { error } = await service.auth.admin.updateUserById(user_id, {
      ban_duration: blocked ? 'none' : '876600h' // ~100 ans
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ ok: true })
  }

  if (action === 'delete_org') {
    // Supprimer les données de l'org (cascade via FK normalement, mais on force)
    const { data: dossiers } = await service.from('dossiers').select('id').eq('organisation_id', org_id)
    const dossierIds = dossiers?.map(d => d.id) || []
    if (dossierIds.length > 0) {
      await service.from('actions').delete().in('dossier_id', dossierIds)
      await service.from('factures').delete().in('dossier_id', dossierIds)
      await service.from('contacts').delete().in('dossier_id', dossierIds)
      await service.from('dossiers').delete().eq('organisation_id', org_id)
    }
    // Supprimer les membres auth
    const { data: membres } = await service.from('membres').select('user_id').eq('organisation_id', org_id)
    for (const m of membres || []) {
      await service.auth.admin.deleteUser(m.user_id)
    }
    await service.from('membres').delete().eq('organisation_id', org_id)
    await service.from('organisations').delete().eq('id', org_id)
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
