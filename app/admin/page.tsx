export const dynamic = 'force-dynamic'
import { createServerSupabaseClient, createServiceSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AdminPage() {
  const supabase = createServerSupabaseClient()
  const serviceSupabase = createServiceSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Vérifier superadmin
  const { data: membre } = await supabase
    .from('membres')
    .select('superadmin')
    .eq('user_id', user.id)
    .single()

  if (!membre?.superadmin) redirect('/')

  // Charger toutes les orgs avec stats (service role = bypass RLS)
  const { data: orgs } = await serviceSupabase
    .from('organisations')
    .select('*')
    .order('created_at', { ascending: false })

  // Stats par org
  const orgsWithStats = await Promise.all((orgs || []).map(async (org) => {
    const { data: dossiers } = await serviceSupabase
      .from('dossiers')
      .select('montant_total, statut, created_at')
      .eq('organisation_id', org.id)

    const { data: membres } = await serviceSupabase
      .from('membres')
      .select('email, role, created_at')
      .eq('organisation_id', org.id)

    const { data: lastAction } = await serviceSupabase
      .from('actions')
      .select('created_at')
      .in('dossier_id',
        (await serviceSupabase.from('dossiers').select('id').eq('organisation_id', org.id)).data?.map(d => d.id) || []
      )
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    const totalMontant = (dossiers || []).reduce((sum, d) => sum + (d.montant_total || 0), 0)
    const nbActifs = (dossiers || []).filter(d => d.statut !== 'resolu').length
    const nbResolus = (dossiers || []).filter(d => d.statut === 'resolu').length

    return {
      ...org,
      nb_dossiers: dossiers?.length || 0,
      nb_actifs: nbActifs,
      nb_resolus: nbResolus,
      total_montant: totalMontant,
      nb_membres: membres?.length || 0,
      membres: membres || [],
      last_action: lastAction?.created_at || null,
    }
  }))

  const totalOrgs = orgsWithStats.length
  const totalMontant = orgsWithStats.reduce((sum, o) => sum + o.total_montant, 0)
  const totalDossiers = orgsWithStats.reduce((sum, o) => sum + o.nb_dossiers, 0)
  
  // MRR estimé
  const PLAN_PRIX: Record<string, number> = { demo: 0, solo: 49, agence: 199 }
  const mrr = orgsWithStats.reduce((sum, o) => sum + (PLAN_PRIX[o.plan || 'demo'] || 0), 0)
  const payants = orgsWithStats.filter(o => o.plan && o.plan !== 'demo').length

  function formatMontant(n: number) {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
  }

  function formatDate(d: string | null) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' })
  }

  function daysSince(d: string | null) {
    if (!d) return null
    return Math.floor((Date.now() - new Date(d).getTime()) / 86400000)
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Admin</h1>
          <p className="text-sm text-gray-400 mt-0.5">Vue superadmin — toutes les organisations</p>
        </div>
        <Link href="/" className="text-sm text-indigo-600 hover:underline">← Retour app</Link>
      </div>

      {/* Stats globales */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Organisations', value: totalOrgs, icon: '🏢' },
          { label: 'MRR', value: formatMontant(mrr), icon: '💳', sub: `${payants} client${payants > 1 ? 's' : ''} payant${payants > 1 ? 's' : ''}` },
          { label: 'Total en jeu', value: formatMontant(totalMontant), icon: '💰' },
          { label: 'Dossiers actifs', value: totalDossiers, icon: '📁' },
        ].map(s => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <div className="text-2xl mb-2">{s.icon}</div>
            <div className="text-2xl font-bold text-gray-900">{s.value}</div>
            <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
            {'sub' in s && s.sub && <div className="text-xs text-indigo-500 font-medium mt-0.5">{(s as any).sub}</div>}
          </div>
        ))}
      </div>

      {/* Table orgs */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Organisations ({totalOrgs})</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {orgsWithStats.map(org => {
            const lastActivity = daysSince(org.last_action)
            const isInactive = lastActivity === null || lastActivity > 7
            return (
              <div key={org.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900">{org.nom}</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        org.plan === 'agence' ? 'bg-purple-100 text-purple-700' :
                        org.plan === 'solo' ? 'bg-indigo-100 text-indigo-700' :
                        'bg-gray-100 text-gray-500'
                      }`}>{org.plan || 'demo'}</span>
                      {isInactive && org.nb_dossiers > 0 && (
                        <span className="text-xs bg-red-50 text-red-500 border border-red-100 rounded-full px-2 py-0.5">
                          Inactif {lastActivity ? `${lastActivity}j` : ''}
                        </span>
                      )}
                      {!isInactive && (
                        <span className="text-xs bg-green-50 text-green-600 border border-green-100 rounded-full px-2 py-0.5">
                          Actif
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {org.membres.map((m: any) => m.email).join(', ')}
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>📁 {org.nb_dossiers} dossiers</span>
                      <span>✅ {org.nb_resolus} résolus</span>
                      <span>👥 {org.nb_membres} membre{org.nb_membres > 1 ? 's' : ''}</span>
                      <span>Dernière action : {formatDate(org.last_action)}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-bold text-lg text-gray-900">{formatMontant(org.total_montant)}</div>
                    <div className="text-xs text-gray-400">en jeu</div>
                    <div className="text-xs text-gray-300 mt-1">Inscrit {formatDate(org.created_at)}</div>
                  </div>
                </div>
              </div>
            )
          })}
          {orgsWithStats.length === 0 && (
            <div className="px-6 py-12 text-center text-gray-400 text-sm">
              Aucune organisation pour l'instant.
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
