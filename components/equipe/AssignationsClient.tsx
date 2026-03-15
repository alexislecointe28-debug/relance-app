'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { formatMontant, getStatutDossierLabel, getStatutDossierColor } from '@/lib/utils'

interface Membre { id: string; prenom?: string; nom?: string; email: string; role: string }
interface Dossier {
  id: string; societe: string; montant_total: number; jours_retard: number
  statut: string; assigned_to: string | null
  assignee?: { id: string; prenom?: string; nom?: string; email: string } | null
}

export default function AssignationsClient({
  dossiers: initial, membres
}: { dossiers: Dossier[], membres: Membre[] }) {
  const supabase = createClient()
  const [dossiers, setDossiers] = useState(initial)
  const [saving, setSaving] = useState<string | null>(null)
  const [filterMembre, setFilterMembre] = useState<string>('all')
  const [search, setSearch] = useState('')

  function membreName(m: Membre) {
    return m.prenom && m.nom ? `${m.prenom} ${m.nom}` : m.email
  }

  async function assign(dossierId: string, memberId: string | null) {
    setSaving(dossierId)
    await supabase.from('dossiers').update({ assigned_to: memberId }).eq('id', dossierId)
    const assignee = memberId ? membres.find(m => m.id === memberId) || null : null
    setDossiers(prev => prev.map(d => d.id === dossierId ? { ...d, assigned_to: memberId, assignee } : d))
    setSaving(null)
  }

  const filtered = useMemo(() => dossiers.filter(d => {
    if (filterMembre === 'unassigned') return !d.assigned_to
    if (filterMembre !== 'all') return d.assigned_to === filterMembre
    if (search) return d.societe.toLowerCase().includes(search.toLowerCase())
    return true
  }), [dossiers, filterMembre, search])

  // Stats par membre
  const stats = useMemo(() => {
    const map: Record<string, number> = { unassigned: 0 }
    membres.forEach(m => { map[m.id] = 0 })
    dossiers.forEach(d => {
      if (d.assigned_to) map[d.assigned_to] = (map[d.assigned_to] || 0) + 1
      else map.unassigned++
    })
    return map
  }, [dossiers, membres])

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/equipe" className="text-xs text-gray-400 hover:text-gray-600 mb-1 block">← Équipe</Link>
          <h1 className="text-2xl font-bold text-gray-900">Assignations</h1>
          <p className="text-sm text-gray-400 mt-0.5">{dossiers.length} dossiers · {stats.unassigned} non assignés</p>
        </div>
      </div>

      {/* Stats membres */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <button onClick={() => setFilterMembre('all')}
          className={`p-3 rounded-xl border text-left transition-all ${filterMembre === 'all' ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
          <div className="text-lg font-black text-gray-900">{dossiers.length}</div>
          <div className="text-xs text-gray-500">Tous</div>
        </button>
        <button onClick={() => setFilterMembre('unassigned')}
          className={`p-3 rounded-xl border text-left transition-all ${filterMembre === 'unassigned' ? 'border-amber-400 bg-amber-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
          <div className="text-lg font-black text-amber-600">{stats.unassigned}</div>
          <div className="text-xs text-gray-500">Non assignés</div>
        </button>
        {membres.filter(m => m.role !== 'admin' || membres.length <= 3).slice(0, 2).map(m => (
          <button key={m.id} onClick={() => setFilterMembre(m.id)}
            className={`p-3 rounded-xl border text-left transition-all ${filterMembre === m.id ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
            <div className="text-lg font-black text-gray-900">{stats[m.id] || 0}</div>
            <div className="text-xs text-gray-500 truncate">{membreName(m)}</div>
          </button>
        ))}
      </div>

      {/* Recherche */}
      <input
        type="text" value={search} onChange={e => setSearch(e.target.value)}
        placeholder="Rechercher une société..."
        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-300"
      />

      {/* Tableau */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="px-4 py-3 text-left text-xs text-gray-400 uppercase tracking-wider">Société</th>
              <th className="px-4 py-3 text-left text-xs text-gray-400 uppercase tracking-wider hidden sm:table-cell">Montant</th>
              <th className="px-4 py-3 text-left text-xs text-gray-400 uppercase tracking-wider hidden sm:table-cell">Retard</th>
              <th className="px-4 py-3 text-left text-xs text-gray-400 uppercase tracking-wider">Assigné à</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map(d => (
              <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <Link href={`/dossiers/${d.id}`} className="font-semibold text-gray-900 hover:text-indigo-600 transition-colors">
                    {d.societe}
                  </Link>
                  <div className={`text-xs mt-0.5 inline-block px-1.5 py-0.5 rounded ${getStatutDossierColor(d.statut as any)}`}>
                    {getStatutDossierLabel(d.statut as any)}
                  </div>
                </td>
                <td className="px-4 py-3 font-semibold text-gray-700 hidden sm:table-cell">
                  {formatMontant(d.montant_total)}
                </td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  <span className={`text-xs font-semibold ${d.jours_retard > 90 ? 'text-red-500' : d.jours_retard > 30 ? 'text-amber-500' : 'text-gray-500'}`}>
                    {d.jours_retard}j
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <select
                      value={d.assigned_to || ''}
                      onChange={e => assign(d.id, e.target.value || null)}
                      disabled={saving === d.id}
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:opacity-50 max-w-[160px]"
                    >
                      <option value="">— Non assigné —</option>
                      {membres.map(m => (
                        <option key={m.id} value={m.id}>{membreName(m)}</option>
                      ))}
                    </select>
                    {saving === d.id && <span className="text-xs text-gray-400">...</span>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-sm">Aucun dossier trouvé</div>
        )}
      </div>
    </main>
  )
}
