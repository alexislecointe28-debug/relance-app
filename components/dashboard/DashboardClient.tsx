'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Dossier, Action, StatutDossier } from '@/types'
import { formatMontant, getStatutDossierLabel, getStatutDossierColor, formatDate } from '@/lib/utils'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface Props {
  dossiers: (Dossier & { nb_factures: number })[]
  rappels: (Action & { dossier: Dossier })[]
  stats: { total_montant: number; dossiers_actifs: number; a_relancer: number; pct_qualifies: number }
}

export default function DashboardClient({ dossiers: initialDossiers, rappels, stats }: Props) {
  const [dossiers, setDossiers] = useState(initialDossiers)
  const [showAll, setShowAll] = useState(false)
  const [rappelsDismissed, setRappelsDismissed] = useState<Set<string>>(new Set())
  const router = useRouter()
  const supabase = createClient()

  const urgences = useMemo(() =>
    [...dossiers]
      .filter(d => d.statut !== 'resolu')
      .sort((a, b) => b.jours_retard - a.jours_retard),
    [dossiers]
  )

  const aQualifier = dossiers.filter(d => !d.contact).length
  const rappelsVisible = rappels.filter(r => !rappelsDismissed.has(r.id))
  const displayed = showAll ? urgences : urgences.slice(0, 5)

  async function markRappelDone(actionId: string) {
    await supabase.from('actions').update({ rappel_fait: true }).eq('id', actionId)
    setRappelsDismissed(prev => new Set(Array.from(prev).concat(actionId)))
    router.refresh()
  }

  function contextLabel(d: Dossier & { nb_factures: number }) {
    if (d.jours_retard > 200) return 'Plus d\'excuses qui tiennent'
    if (d.jours_retard > 90) return 'Ça commence à faire long'
    if (d.jours_retard > 30) return 'Le moment de passer un coup de fil'
    return `${d.nb_factures} facture${d.nb_factures > 1 ? 's' : ''} en attente`
  }

  return (
    <main className="max-w-2xl mx-auto px-3 sm:px-6 py-6 space-y-5">

      {/* Hero */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
        <div className="text-sm text-gray-400 mb-1">Ton argent qui dort</div>
        <div className="text-4xl font-bold text-gray-900 mb-3">{formatMontant(stats.total_montant)}</div>
        <div className="inline-block text-xs font-semibold text-indigo-600 bg-indigo-50 rounded-lg px-3 py-1.5">
          {stats.a_relancer} client{stats.a_relancer > 1 ? 's' : ''} n'attendent que toi
        </div>
      </div>

      {/* 2 actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/qualifier">
          <div className="bg-indigo-600 rounded-2xl p-4 h-full">
            <div className="text-xl mb-2">🎯</div>
            <div className="text-sm font-semibold text-white mb-1">Qualifier</div>
            <div className="text-xs text-indigo-200 leading-snug mb-3">
              {aQualifier > 0
                ? `${aQualifier} contacts sans info. Tu relances dans le vide.`
                : 'Tous tes contacts sont qualifiés. Bien joué.'}
            </div>
            <div className="text-xs font-semibold text-white bg-white/20 rounded-lg px-3 py-1.5 inline-block">
              C'est parti →
            </div>
          </div>
        </Link>

        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
          <div className="text-xl mb-2">📞</div>
          <div className="text-sm font-semibold text-gray-900 mb-1">Relancer</div>
          <div className="text-xs text-gray-400 leading-snug mb-3">
            {stats.a_relancer > 0
              ? `${stats.a_relancer} urgences aujourd'hui. Déclenche-les.`
              : 'Pas d\'urgence pour l\'instant. Profites-en.'}
          </div>
          <div
            onClick={() => document.getElementById('urgences')?.scrollIntoView({ behavior: 'smooth' })}
            className="text-xs font-semibold text-indigo-600 bg-indigo-50 rounded-lg px-3 py-1.5 inline-block cursor-pointer"
          >
            Voir les urgences →
          </div>
        </div>
      </div>

      {/* Rappels */}
      {rappelsVisible.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Rappels ({rappelsVisible.length})</h2>
          </div>
          <div className="space-y-2">
            {rappelsVisible.map(rappel => (
              <div key={rappel.id} className="flex items-center gap-3 p-3 rounded-xl border border-orange-200 bg-orange-50">
                <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-sm flex-shrink-0">
                  {rappel.type === 'appel' ? '📞' : '✉️'}
                </div>
                <div className="flex-1 min-w-0">
                  <Link href={`/dossiers/${rappel.dossier?.id}`} className="font-medium text-sm text-gray-900 truncate block hover:underline">
                    {rappel.dossier?.societe || '—'}
                  </Link>
                  <div className="text-xs text-gray-500 truncate">{rappel.notes || 'Pas de note'}</div>
                </div>
                <button onClick={() => markRappelDone(rappel.id)} className="px-2.5 py-1 rounded-lg bg-white border border-gray-200 text-xs font-medium text-gray-700 flex-shrink-0">
                  ✓ Fait
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Urgences */}
      <section id="urgences">
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Urgences du jour</h2>
          <div className="flex-1 h-px bg-gray-100" />
          <span className="text-xs text-gray-400">{urgences.length} dossiers</span>
        </div>

        <div className="space-y-2">
          {displayed.map(dossier => (
            <div key={dossier.id} className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
              <div className="flex items-center gap-3">
                <div className={`w-1 self-stretch rounded-full flex-shrink-0 ${dossier.jours_retard > 60 ? 'bg-red-400' : dossier.jours_retard > 30 ? 'bg-orange-400' : 'bg-gray-200'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <Link href={`/dossiers/${dossier.id}`} className="font-semibold text-sm text-gray-900 truncate hover:underline">
                      {dossier.societe}
                    </Link>
                    <div className="font-bold text-sm text-gray-900 whitespace-nowrap flex-shrink-0">{formatMontant(dossier.montant_total)}</div>
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5 truncate">{contextLabel(dossier)} · {dossier.jours_retard}j</div>
                </div>
              </div>
              <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-gray-100">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${getStatutDossierColor(dossier.statut)}`}>
                  {getStatutDossierLabel(dossier.statut)}
                </span>
                <Link href={`/dossiers/${dossier.id}`}>
                  <button className="text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg px-3 py-1.5 transition-colors">
                    Relancer →
                  </button>
                </Link>
              </div>
            </div>
          ))}
        </div>

        {urgences.length > 5 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="w-full mt-3 py-2.5 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors"
          >
            {showAll ? 'Voir moins' : `Voir les ${urgences.length - 5} autres →`}
          </button>
        )}
      </section>

    </main>
  )
}
