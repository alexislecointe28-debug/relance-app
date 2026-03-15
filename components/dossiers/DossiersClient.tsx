'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Dossier } from '@/types'
import { formatMontant, getStatutDossierLabel, getStatutDossierColor } from '@/lib/utils'
import { createClient } from '@/lib/supabase'

type DossierExt = Dossier & {
  nb_factures: number
  nb_actions: number
  derniere_action: string | null
  archived_at?: string | null
  archive_reason?: string | null
}

const STATUTS = [
  { value: 'all', label: 'Tous' },
  { value: 'a_relancer', label: 'À relancer' },
  { value: 'en_attente', label: 'En attente' },
  { value: 'promesse', label: 'Promesse' },
  { value: 'resolu', label: 'Résolu' },
]

const TRIS = [
  { value: 'retard', label: 'Retard' },
  { value: 'montant_desc', label: 'Montant ↓' },
  { value: 'montant_asc', label: 'Montant ↑' },
  { value: 'action', label: 'Dernière action' },
]

const ARCHIVE_REASONS = [
  { value: 'resolu', label: '✅ Résolu', desc: 'Dossier clôturé, payé' },
  { value: 'litige', label: '⚖️ Litige', desc: 'Contestation en cours' },
  { value: 'abandon', label: '🚪 Abandon', desc: 'Décision de ne pas poursuivre' },
  { value: 'irrecouvrable', label: '💀 Irrécouvrable', desc: 'Client disparu, liquidation...' },
]

export default function DossiersClient({ dossiers: initialDossiers }: { dossiers: DossierExt[] }) {
  const [dossiers, setDossiers] = useState(initialDossiers)
  const [statut, setStatut] = useState('all')
  const [tri, setTri] = useState('retard')
  const [search, setSearch] = useState('')
  const [vue, setVue] = useState<'actifs' | 'archives'>('actifs')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [showArchiveModal, setShowArchiveModal] = useState(false)
  const [archiveReason, setArchiveReason] = useState('resolu')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const actifs = dossiers.filter(d => !d.archived_at)
  const archives = dossiers.filter(d => !!d.archived_at)
  const liste = vue === 'actifs' ? actifs : archives

  const filtered = useMemo(() => {
    let list = [...liste]
    if (statut !== 'all') list = list.filter(d => d.statut === statut)
    if (search.trim()) list = list.filter(d => d.societe.toLowerCase().includes(search.toLowerCase()))
    if (tri === 'retard') list.sort((a, b) => b.jours_retard - a.jours_retard)
    if (tri === 'montant_desc') list.sort((a, b) => b.montant_total - a.montant_total)
    if (tri === 'montant_asc') list.sort((a, b) => a.montant_total - b.montant_total)
    if (tri === 'action') list.sort((a, b) => {
      if (!a.derniere_action) return 1
      if (!b.derniere_action) return -1
      return new Date(b.derniere_action).getTime() - new Date(a.derniere_action).getTime()
    })
    return list
  }, [liste, statut, tri, search])

  const totalFiltre = filtered.reduce((s, d) => s + (d.montant_total || 0), 0)
  const allSelected = filtered.length > 0 && filtered.every(d => selected.has(d.id))

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (allSelected) {
      setSelected(prev => {
        const next = new Set(prev)
        filtered.forEach(d => next.delete(d.id))
        return next
      })
    } else {
      setSelected(prev => {
        const next = new Set(prev)
        filtered.forEach(d => next.add(d.id))
        return next
      })
    }
  }

  async function handleArchive() {
    const ids = Array.from(selected)
    setLoading(true)
    const res = await fetch('/api/dossiers/archive', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids, reason: archiveReason }),
    })
    if (res.ok) {
      setDossiers(prev => prev.map(d =>
        ids.includes(d.id) ? { ...d, archived_at: new Date().toISOString(), archive_reason: archiveReason } : d
      ))
      setSelected(new Set())
      setShowArchiveModal(false)
    }
    setLoading(false)
  }

  async function handleUnarchive() {
    const ids = Array.from(selected)
    setLoading(true)
    const res = await fetch('/api/dossiers/unarchive', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    })
    if (res.ok) {
      setDossiers(prev => prev.map(d =>
        ids.includes(d.id) ? { ...d, archived_at: null, archive_reason: null } : d
      ))
      setSelected(new Set())
    }
    setLoading(false)
  }

  async function handleDelete() {
    const ids = Array.from(selected)
    if (!confirm(`Supprimer définitivement ${ids.length} dossier(s) ? Cette action est irréversible.`)) return
    setLoading(true)
    await Promise.all(ids.map(id => fetch(`/api/dossiers/${id}`, { method: 'DELETE' })))
    setDossiers(prev => prev.filter(d => !ids.includes(d.id)))
    setSelected(new Set())
    setLoading(false)
  }

  function getReasonLabel(reason: string | null | undefined) {
    return ARCHIVE_REASONS.find(r => r.value === reason)?.label || '📦 Archivé'
  }

  return (
    <main className="max-w-2xl mx-auto px-3 sm:px-6 py-6 space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Dossiers</h1>
          <div className="text-sm text-gray-400">{filtered.length} dossiers · {formatMontant(totalFiltre)}</div>
        </div>
      </div>

      {/* Toggle actifs / archivés */}
      <div className="flex gap-2 bg-gray-100 rounded-xl p-1 w-fit">
        <button onClick={() => { setVue('actifs'); setSelected(new Set()) }}
          className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${vue === 'actifs' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'}`}>
          Actifs <span className="ml-1 text-gray-400 font-normal">{actifs.length}</span>
        </button>
        <button onClick={() => { setVue('archives'); setSelected(new Set()) }}
          className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${vue === 'archives' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'}`}>
          Archivés <span className="ml-1 text-gray-400 font-normal">{archives.length}</span>
        </button>
      </div>

      {/* Recherche */}
      <input
        type="text" value={search} onChange={e => setSearch(e.target.value)}
        placeholder="Rechercher une société..."
        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
      />

      {/* Filtres statut */}
      {vue === 'actifs' && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {STATUTS.map(s => (
            <button key={s.value} onClick={() => setStatut(s.value)}
              className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${statut === s.value ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
              {s.label}
            </button>
          ))}
        </div>
      )}

      {/* Tri */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {TRIS.map(t => (
          <button key={t.value} onClick={() => setTri(t.value)}
            className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${tri === t.value ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Barre d'actions si sélection */}
      {selected.size > 0 && (
        <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3 animate-fade-in">
          <span className="text-xs font-semibold text-indigo-700 flex-1">
            {selected.size} sélectionné{selected.size > 1 ? 's' : ''}
          </span>
          {vue === 'actifs' ? (
            <button onClick={() => setShowArchiveModal(true)}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold">
              📦 Archiver
            </button>
          ) : (
            <button onClick={handleUnarchive} disabled={loading}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold">
              ♻️ Désarchiver
            </button>
          )}
          <button onClick={handleDelete} disabled={loading}
            className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-semibold">
            🗑 Supprimer
          </button>
          <button onClick={() => setSelected(new Set())}
            className="text-gray-400 hover:text-gray-600 text-sm px-2">✕</button>
        </div>
      )}

      {/* Liste */}
      <div className="space-y-2">
        {/* Sélectionner tout */}
        {filtered.length > 0 && (
          <div className="flex items-center gap-2 px-1">
            <input type="checkbox" checked={allSelected}
              onChange={toggleAll}
              className="accent-indigo-600 w-4 h-4" />
            <span className="text-xs text-gray-400">
              {allSelected ? 'Tout désélectionner' : `Tout sélectionner (${filtered.length})`}
            </span>
          </div>
        )}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-sm">
            {vue === 'archives' ? 'Aucun dossier archivé.' : 'Aucun dossier trouvé.'}
          </div>
        )}

        {filtered.map(dossier => (
          <div key={dossier.id} className={`flex items-center gap-2 bg-white border rounded-xl shadow-sm transition-all ${selected.has(dossier.id) ? 'border-indigo-300 bg-indigo-50/30' : 'border-gray-200'}`}>
            <div className="pl-3 py-3">
              <input type="checkbox" checked={selected.has(dossier.id)}
                onChange={() => toggleSelect(dossier.id)}
                className="accent-indigo-600 w-4 h-4" />
            </div>
            <Link href={`/dossiers/${dossier.id}`} className="flex-1 p-3 pl-1 min-w-0">
              <div className="flex items-center gap-2">
                <div className={`w-1 h-8 rounded-full flex-shrink-0 ${dossier.jours_retard > 60 ? 'bg-red-400' : dossier.jours_retard > 30 ? 'bg-orange-400' : 'bg-gray-200'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-semibold text-sm text-gray-900 truncate">{dossier.societe}</div>
                    <div className="font-bold text-sm text-gray-900 whitespace-nowrap">{formatMontant(dossier.montant_total)}</div>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {dossier.archived_at ? (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-gray-100 text-gray-500">
                        {getReasonLabel(dossier.archive_reason)}
                      </span>
                    ) : (
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${getStatutDossierColor(dossier.statut)}`}>
                        {getStatutDossierLabel(dossier.statut)}
                      </span>
                    )}
                    <span className="text-xs text-gray-400">
                      {dossier.jours_retard}j · {dossier.nb_actions} action{dossier.nb_actions > 1 ? 's' : ''}
                    </span>
                    {dossier.archived_at && (
                      <span className="text-xs text-gray-400">
                        · archivé le {new Date(dossier.archived_at).toLocaleDateString('fr-FR')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>

      {/* Modal archivage */}
      {showArchiveModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl p-6 space-y-4">
            <div>
              <h3 className="font-bold text-gray-900">Archiver {selected.size} dossier{selected.size > 1 ? 's' : ''}</h3>
              <p className="text-xs text-gray-400 mt-1">Les dossiers archivés disparaissent du dashboard mais restent accessibles.</p>
            </div>
            <div className="space-y-2">
              {ARCHIVE_REASONS.map(r => (
                <button key={r.value} onClick={() => setArchiveReason(r.value)}
                  className={`w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${archiveReason === r.value ? 'bg-indigo-50 border-indigo-300' : 'border-gray-200 hover:bg-gray-50'}`}>
                  <span className="text-lg leading-none mt-0.5">{r.label.split(' ')[0]}</span>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{r.label.split(' ').slice(1).join(' ')}</div>
                    <div className="text-xs text-gray-400">{r.desc}</div>
                  </div>
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowArchiveModal(false)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600">
                Annuler
              </button>
              <button onClick={handleArchive} disabled={loading}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold">
                {loading ? '…' : 'Archiver →'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
