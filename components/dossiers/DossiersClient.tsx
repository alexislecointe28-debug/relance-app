'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Dossier } from '@/types'
import { formatMontant, getStatutDossierLabel, getStatutDossierColor } from '@/lib/utils'

type DossierExt = Dossier & { nb_factures: number; nb_actions: number; derniere_action: string | null }

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

export default function DossiersClient({ dossiers }: { dossiers: DossierExt[] }) {
  const [statut, setStatut] = useState('all')
  const [tri, setTri] = useState('retard')
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    let list = [...dossiers]
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
  }, [dossiers, statut, tri, search])

  const totalFiltre = filtered.reduce((s, d) => s + (d.montant_total || 0), 0)

  return (
    <main className="max-w-2xl mx-auto px-3 sm:px-6 py-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Tous les dossiers</h1>
        <div className="text-sm text-gray-400">{filtered.length} dossiers · {formatMontant(totalFiltre)}</div>
      </div>

      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Rechercher une société..."
        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
      />

      <div className="flex gap-2 overflow-x-auto pb-1">
        {STATUTS.map(s => (
          <button key={s.value} onClick={() => setStatut(s.value)}
            className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              statut === s.value ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}>
            {s.label}
          </button>
        ))}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {TRIS.map(t => (
          <button key={t.value} onClick={() => setTri(t.value)}
            className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              tri === t.value ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-sm">Aucun dossier trouvé.</div>
        )}
        {filtered.map(dossier => (
          <Link key={dossier.id} href={`/dossiers/${dossier.id}`}>
            <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm hover:border-indigo-200 transition-colors">
              <div className="flex items-center gap-3">
                <div className={`w-1 self-stretch rounded-full flex-shrink-0 ${dossier.jours_retard > 60 ? 'bg-red-400' : dossier.jours_retard > 30 ? 'bg-orange-400' : 'bg-gray-200'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-semibold text-sm text-gray-900 truncate">{dossier.societe}</div>
                    <div className="font-bold text-sm text-gray-900 whitespace-nowrap">{formatMontant(dossier.montant_total)}</div>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${getStatutDossierColor(dossier.statut)}`}>
                      {getStatutDossierLabel(dossier.statut)}
                    </span>
                    <span className="text-xs text-gray-400">{dossier.jours_retard}j · {dossier.nb_actions} action{dossier.nb_actions > 1 ? 's' : ''}</span>
                    {dossier.derniere_action && (
                      <span className="text-xs text-gray-400">· {new Date(dossier.derniere_action).toLocaleDateString('fr-FR')}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  )
}
