'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Dossier, Action, StatutDossier } from '@/types'
import { formatMontant, getStatutDossierLabel, getStatutDossierColor, getRappelColor, formatDate } from '@/lib/utils'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface Props {
  dossiers: (Dossier & { nb_factures: number })[]
  rappels: (Action & { dossier: Dossier })[]
  stats: { total_montant: number; dossiers_actifs: number; a_relancer: number; pct_qualifies: number }
}

const FILTRES = [
  { key: 'tous', label: 'Tous' },
  { key: 'a_relancer', label: 'À relancer' },
  { key: 'en_attente', label: 'En attente' },
  { key: 'promesse', label: 'Promesse' },
  { key: 'resolu', label: 'Résolu' },
] as const

export default function DashboardClient({ dossiers: initialDossiers, rappels, stats }: Props) {
  const [dossiers, setDossiers] = useState(initialDossiers)
  const [filtre, setFiltre] = useState<string>('tous')
  const [tri, setTri] = useState<'retard' | 'montant'>('retard')
  const [rappelsDismissed, setRappelsDismissed] = useState<Set<string>>(new Set())
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteAllConfirm, setDeleteAllConfirm] = useState(false)
  const [deleteAllLoading, setDeleteAllLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const dossiersFiltres = useMemo(() => {
    let list = filtre === 'tous' ? dossiers : dossiers.filter(d => d.statut === filtre)
    if (tri === 'retard') list = [...list].sort((a, b) => b.jours_retard - a.jours_retard)
    else list = [...list].sort((a, b) => b.montant_total - a.montant_total)
    return list
  }, [dossiers, filtre, tri])

  const rappelsVisible = rappels.filter(r => !rappelsDismissed.has(r.id))

  async function markRappelDone(actionId: string) {
    await supabase.from('actions').update({ rappel_fait: true }).eq('id', actionId)
    setRappelsDismissed(prev => new Set(Array.from(prev).concat(actionId)))
    router.refresh()
  }

  async function handleDelete(e: React.MouseEvent, id: string) {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm('Supprimer ce dossier ? Cette action est irréversible.')) return
    setDeletingId(id)
    await fetch(`/api/dossiers/${id}`, { method: 'DELETE' })
    setDossiers(prev => prev.filter(d => d.id !== id))
    setDeletingId(null)
  }

  async function handleDeleteAll() {
    setDeleteAllLoading(true)
    await fetch('/api/dossiers/delete-all', { method: 'DELETE' })
    setDossiers([])
    setDeleteAllConfirm(false)
    setDeleteAllLoading(false)
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 shadow-sm">
          <div className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-1">Total à recouvrer</div>
          <div className="text-xl sm:text-2xl font-bold stat-value montant-display text-gray-900">{formatMontant(stats.total_montant)}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 shadow-sm">
          <div className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-1">Dossiers actifs</div>
          <div className="text-xl sm:text-2xl font-bold stat-value text-gray-900">{stats.dossiers_actifs}</div>
        </div>
        <div className={`border rounded-xl p-4 sm:p-5 shadow-sm ${stats.a_relancer > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}>
          <div className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-1">À relancer</div>
          <div className={`text-xl sm:text-2xl font-bold stat-value ${stats.a_relancer > 0 ? 'text-red-600' : 'text-gray-900'}`}>{stats.a_relancer}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 shadow-sm">
          <div className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-1">Contacts qualifiés</div>
          <div className="text-xl sm:text-2xl font-bold montant-display mb-3 text-gray-900">{stats.pct_qualifies}%</div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 rounded-full progress-bar" style={{ width: `${stats.pct_qualifies}%` }} />
          </div>
        </div>
      </div>

      {/* Rappels */}
      {rappelsVisible.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wider">Rappels ({rappelsVisible.length})</h2>
          </div>
          <div className="grid gap-2">
            {rappelsVisible.map(rappel => (
              <div key={rappel.id} className="flex items-center gap-3 p-3 rounded-xl border border-orange-200 bg-orange-50">
                <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-sm flex-shrink-0">
                  {rappel.type === 'appel' ? '📞' : '✉️'}
                </div>
                <div className="flex-1 min-w-0">
                  <Link href={`/dossiers/${rappel.dossier?.id}`} className="font-medium text-sm hover:underline text-gray-900 truncate block">
                    {rappel.dossier?.societe || '—'}
                  </Link>
                  <div className="text-xs text-gray-500 truncate">{rappel.notes || 'Pas de note'}</div>
                </div>
                <div className="hidden sm:block text-xs font-mono text-gray-500 flex-shrink-0">{formatDate(rappel.rappel_le)}</div>
                <button onClick={() => markRappelDone(rappel.id)} className="px-2.5 py-1 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 text-xs font-medium text-gray-700 flex-shrink-0">
                  ✓ Fait
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Dossiers */}
      <section>

        {/* Filtres — scroll horizontal sur mobile */}
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 mb-3">
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-max sm:w-auto">
            {FILTRES.map(f => (
              <button key={f.key} onClick={() => setFiltre(f.key)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${filtre === f.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tri + Supprimer */}
        <div className="flex items-center justify-between mb-4 gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 hidden sm:inline">Trier par</span>
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
              <button onClick={() => setTri('retard')} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${tri === 'retard' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>Retard</button>
              <button onClick={() => setTri('montant')} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${tri === 'montant' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>Montant</button>
            </div>
          </div>

          {dossiers.length > 0 && (
            deleteAllConfirm ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-red-600 font-medium hidden sm:inline">Supprimer tout ?</span>
                <button onClick={handleDeleteAll} disabled={deleteAllLoading}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-medium disabled:opacity-50">
                  {deleteAllLoading ? '…' : 'Confirmer'}
                </button>
                <button onClick={() => setDeleteAllConfirm(false)}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-50">
                  Annuler
                </button>
              </div>
            ) : (
              <button onClick={() => setDeleteAllConfirm(true)}
                className="px-3 py-1.5 border border-red-200 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg text-xs font-medium transition-colors">
                Tout supprimer
              </button>
            )
          )}
        </div>

        {dossiersFiltres.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <div className="text-4xl mb-3">📂</div>
            <p>Aucun dossier dans cette catégorie</p>
          </div>
        ) : (
          <div className="grid gap-2">
            {dossiersFiltres.map(dossier => (
              <Link key={dossier.id} href={`/dossiers/${dossier.id}`}>
                <div className="card-hover bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className={`w-1 self-stretch rounded-full flex-shrink-0 ${dossier.jours_retard > 60 ? 'bg-red-400' : dossier.jours_retard > 30 ? 'bg-orange-400' : 'bg-gray-200'}`} />

                    <div className="flex-1 min-w-0">
                      {/* Ligne 1 : société + montant */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-semibold text-sm text-gray-900 truncate">{dossier.societe}</div>
                        <div className="font-bold text-sm montant-display text-gray-900 flex-shrink-0">{formatMontant(dossier.montant_total)}</div>
                      </div>
                      {/* Ligne 2 : factures + retard + badge */}
                      <div className="flex items-center justify-between gap-2 mt-1">
                        <div className="text-xs text-gray-400">
                          {dossier.nb_factures} facture{dossier.nb_factures > 1 ? 's' : ''}
                          {dossier.jours_retard > 0 && (
                            <span className={`ml-2 ${dossier.jours_retard > 60 ? 'text-red-500' : 'text-orange-500'}`}>
                              • {dossier.jours_retard}j
                            </span>
                          )}
                        </div>
                        <span className={`badge flex-shrink-0 ${getStatutDossierColor(dossier.statut)}`}>
                          {getStatutDossierLabel(dossier.statut)}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={(e) => handleDelete(e, dossier.id)}
                      disabled={deletingId === dossier.id}
                      className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0 disabled:opacity-50"
                      title="Supprimer ce dossier"
                    >
                      {deletingId === dossier.id ? (
                        <span className="text-xs">…</span>
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                        </svg>
                      )}
                    </button>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-300 flex-shrink-0">
                      <path d="M9 18l6-6-6-6"/>
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
