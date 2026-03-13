'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Dossier, Action, StatutDossier } from '@/types'
import { formatMontant, getStatutDossierLabel, getStatutDossierColor } from '@/lib/utils'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface Props {
  dossiers: (Dossier & { nb_factures: number })[]
  rappels: (Action & { dossier: Dossier })[]
  stats: { total_montant: number; dossiers_actifs: number; a_relancer: number; pct_qualifies: number }
}

function getHeroText(montant: string) {
  const h = new Date().getHours()
  if (h >= 5 && h < 9) return `T'es debout \u00e0 cette heure-l\u00e0 et t'as ${montant} qui ne sont pas sur ton compte. Fais quelque chose.`
  if (h >= 9 && h < 12) return `La matin\u00e9e appartient aux courageux. ${montant} attendent que t'en sois un.`
  if (h >= 12 && h < 14) return "Ton client mange bien. Lui il a pas pay\u00e9 mais il mange bien."
  if (h >= 14 && h < 18) return `L'heure de la sieste c'est pour tes concurrents. Toi t'as ${montant} \u00e0 aller chercher.`
  if (h >= 18 && h < 23) return "Bilan de journ\u00e9e. T'as boug\u00e9 combien aujourd'hui ?"
  return "T'aurais mieux fait de rappeler plut\u00f4t que scroller."
}

function contextLabel(joursRetard: number) {
  if (joursRetard > 200) return "Il a oubli\u00e9 ton existence. Rappelle-lui."
  if (joursRetard > 90) return "3 mois. M\u00eame ton ex a r\u00e9pondu plus vite."
  if (joursRetard > 60) return "Il esp\u00e8re que t'as perdu son num\u00e9ro."
  if (joursRetard > 30) return "Encore chaud. Frappe maintenant."
  return "Tout frais. Un mail, une relance, c'est pli\u00e9."
}

function urgenceColor(j: number) {
  if (j > 60) return { bar: 'bg-red-500', badge: 'bg-red-50 text-red-600 border-red-200', glow: 'shadow-red-100' }
  if (j > 30) return { bar: 'bg-orange-400', badge: 'bg-orange-50 text-orange-600 border-orange-200', glow: 'shadow-orange-100' }
  return { bar: 'bg-yellow-400', badge: 'bg-yellow-50 text-yellow-600 border-yellow-200', glow: 'shadow-yellow-100' }
}

export default function DashboardClient({ dossiers: initialDossiers, rappels, stats }: Props) {
  const [dossiers, setDossiers] = useState(initialDossiers)
  const [skipped, setSkipped] = useState<Set<string>>(new Set())
  const [rappelsDismissed, setRappelsDismissed] = useState<Set<string>>(new Set())
  const [scoreJour, setScoreJour] = useState(0)
  const [streak, setStreak] = useState(0)
  const [streakBroken, setStreakBroken] = useState(false)
  const [modalDossier, setModalDossier] = useState<(Dossier & { nb_factures: number }) | null>(null)
  const [modalType, setModalType] = useState<'appel' | 'email'>('appel')
  const [modalNotes, setModalNotes] = useState('')
  const [modalNiveau, setModalNiveau] = useState('cordial')
  const [modalLoading, setModalLoading] = useState(false)
  const [modalRappel, setModalRappel] = useState('')
  const [modalStatut, setModalStatut] = useState<StatutDossier | null>(null)
  // Swipe state
  const [swipeX, setSwipeX] = useState(0)
  const [swiping, setSwiping] = useState(false)
  const [swipeDir, setSwipeDir] = useState<'left' | 'right' | null>(null)
  const [exiting, setExiting] = useState(false)
  const startX = useRef(0)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    const lastDate = localStorage.getItem('relance_last_date')
    const saved = parseInt(localStorage.getItem('relance_streak') || '0')
    if (!lastDate) return
    const diff = Math.floor((new Date(today).getTime() - new Date(lastDate).getTime()) / 86400000)
    if (diff <= 1) setStreak(saved)
    else { setStreakBroken(true); setStreak(0) }
  }, [])

  const urgences = useMemo(() =>
    [...dossiers].filter(d => d.statut !== 'resolu' && !skipped.has(d.id))
      .sort((a, b) => b.jours_retard - a.jours_retard),
    [dossiers, skipped]
  )

  const current = urgences[0] || null
  const next = urgences[1] || null
  const aQualifier = dossiers.filter(d => !d.contact).length
  const rappelsVisible = rappels.filter(r => !rappelsDismissed.has(r.id))
  const montantFormate = formatMontant(stats.total_montant)

  async function markRappelDone(actionId: string) {
    await supabase.from('actions').update({ rappel_fait: true }).eq('id', actionId)
    setRappelsDismissed(prev => new Set(Array.from(prev).concat(actionId)))
    router.refresh()
  }

  function incrementStreak() {
    const today = new Date().toISOString().split('T')[0]
    const lastDate = localStorage.getItem('relance_last_date')
    const saved = parseInt(localStorage.getItem('relance_streak') || '0')
    const diff = lastDate ? Math.floor((new Date(today).getTime() - new Date(lastDate).getTime()) / 86400000) : 999
    const newStreak = diff <= 1 ? saved + 1 : 1
    localStorage.setItem('relance_streak', String(newStreak))
    localStorage.setItem('relance_last_date', today)
    setStreak(newStreak)
    setStreakBroken(false)
  }

  function skipCurrent() {
    if (!current) return
    setExiting(true)
    setSwipeDir('left')
    setTimeout(() => {
      setSkipped(prev => new Set(Array.from(prev).concat(current.id)))
      setSwipeX(0)
      setSwiping(false)
      setSwipeDir(null)
      setExiting(false)
    }, 300)
  }

  function openRelancer(dossier: Dossier & { nb_factures: number }, type: 'appel' | 'email' = 'appel') {
    setModalDossier(dossier)
    setModalNotes('')
    setModalNiveau('cordial')
    setModalType(type)
    setModalRappel('')
    setModalStatut(null)
  }

  async function handleModalSave() {
    if (!modalDossier) return
    setModalLoading(true)
    const { data: membre } = await supabase.from('membres').select('id').single()
    await supabase.from('actions').insert({
      dossier_id: modalDossier.id,
      type: modalType,
      niveau_email: modalType === 'email' ? modalNiveau : null,
      notes: modalNotes,
      membre_id: membre?.id,
      rappel_at: modalRappel || null
    })
    if (modalStatut) {
      await supabase.from('dossiers').update({ statut: modalStatut }).eq('id', modalDossier.id)
      const labels: Record<string, string> = { resolu: 'Dossier r\u00e9solu', promesse: 'Promesse de paiement', en_attente: 'En attente', a_relancer: '\u00c0 relancer' }
      await supabase.from('actions').insert({ dossier_id: modalDossier.id, type: 'note', notes: 'Statut mis \u00e0 jour : ' + labels[modalStatut], membre_id: membre?.id })
      if (modalStatut === 'resolu') {
        const s = document.createElement('script')
        s.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.2/dist/confetti.browser.min.js'
        s.onload = () => { (window as any).confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ['#6366F1', '#10B981', '#F59E0B'] }) }
        document.head.appendChild(s)
      }
      if (modalStatut === 'resolu') {
        setDossiers(prev => prev.map(d => d.id === modalDossier.id ? { ...d, statut: 'resolu' as StatutDossier } : d))
      }
    }
    const newScore = scoreJour + 1
    setScoreJour(newScore)
    if (newScore === 1) incrementStreak()

    // Passer \u00e0 la carte suivante
    setExiting(true)
    setSwipeDir('right')
    setTimeout(() => {
      setSkipped(prev => new Set(Array.from(prev).concat(modalDossier.id)))
      setSwipeX(0)
      setSwiping(false)
      setSwipeDir(null)
      setExiting(false)
    }, 300)

    setModalLoading(false)
    setModalDossier(null)
    router.refresh()
  }

  // Touch handlers
  function onTouchStart(e: React.TouchEvent) {
    startX.current = e.touches[0].clientX
    setSwiping(true)
  }
  function onTouchMove(e: React.TouchEvent) {
    const dx = e.touches[0].clientX - startX.current
    setSwipeX(dx)
    setSwipeDir(dx > 0 ? 'right' : 'left')
  }
  function onTouchEnd() {
    if (Math.abs(swipeX) > 80) {
      if (swipeDir === 'left') skipCurrent()
      else if (swipeDir === 'right' && current) openRelancer(current)
    } else {
      setSwipeX(0)
      setSwipeDir(null)
    }
    setSwiping(false)
  }


  // Flèches clavier desktop
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (!current || modalDossier) return
      if (e.key === 'ArrowLeft') skipCurrent()
      if (e.key === 'ArrowRight') openRelancer(current)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [current, modalDossier, skipped])

  const colors = current ? urgenceColor(current.jours_retard) : null

  return (
    <main className="max-w-2xl mx-auto px-3 sm:px-6 py-6 space-y-5">

      {/* Hero */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
        <div className="text-sm text-gray-400 mb-1">Ton argent qui dort</div>
        <div className="text-4xl font-bold text-gray-900 mb-3">{montantFormate}</div>
        <div className="text-sm text-gray-600 mb-4 leading-snug">{getHeroText(montantFormate)}</div>
        <div className="flex flex-wrap gap-2">
          {scoreJour > 0 && (
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5">
              <span>💪</span>
              {scoreJour === 1 ? "1 relance aujourd'hui. C'est un d\u00e9but." : `${scoreJour} relances aujourd'hui. T'es en feu.`}
            </div>
          )}
          {streak > 0 && (
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-orange-700 bg-orange-50 border border-orange-200 rounded-lg px-3 py-1.5">
              <span>🔥</span>
              {streak === 1 && "Jour 1. Tout le monde commence quelque part."}
              {streak === 2 && "2 jours de suite. Continue."}
              {streak >= 3 && streak < 7 && `${streak} jours de suite. T'as pris le pli.`}
              {streak >= 7 && streak < 14 && "7 jours. Tu deviens dangereux."}
              {streak >= 14 && `${streak} jours sans l\u00e2cher. Tes clients commencent \u00e0 flipper.`}
            </div>
          )}
          {streakBroken && streak === 0 && (
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
              <span>💤</span>T'avais une belle s\u00e9rie. Elle t'attend.
            </div>
          )}
          {scoreJour === 0 && (
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-1.5">
              {stats.a_relancer} client{stats.a_relancer > 1 ? 's' : ''} n'attendent que toi
            </div>
          )}
        </div>
      </div>

      {/* Bloc qualifier */}
      {aQualifier > 0 && (
        <Link href="/qualifier">
          <div className="bg-indigo-600 rounded-2xl p-4 flex items-center gap-4">
            <div className="text-2xl">🎯</div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-white">{aQualifier} fantôme{aQualifier > 1 ? 's' : ''} dans ta liste.</div>
              <div className="text-xs text-indigo-200">Tu leur parles ou tu fais semblant ?</div>
            </div>
            <div className="text-xs font-semibold text-white bg-white/20 rounded-lg px-3 py-1.5 whitespace-nowrap">C'est parti →</div>
          </div>
        </Link>
      )}

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

      {/* Cartes swipe */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            {urgences.length > 0 ? `${urgences.length} dossier${urgences.length > 1 ? 's' : ''} \u00e0 traiter` : 'Tout est trait\u00e9 💪'}
          </h2>
          <div className="flex-1 h-px bg-gray-100" />
          {skipped.size > 0 && (
            <button onClick={() => setSkipped(new Set())} className="text-xs text-indigo-500 hover:underline">
              Revoir les {skipped.size} pass\u00e9s
            </button>
          )}
        </div>

        {urgences.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center shadow-sm">
            <div className="text-4xl mb-3">🏆</div>
            <div className="font-semibold text-gray-900 mb-1">File vide. T'as tout trait\u00e9.</div>
            <div className="text-sm text-gray-400">Ou presque. Mais on va faire semblant que c'est bien.</div>
          </div>
        ) : (
          <div className="relative sm:mx-14" style={{ height: '280px' }}>

            {/* Boutons desktop gauche/droite */}
        <button
          onClick={skipCurrent}
          className="hidden sm:flex absolute -left-14 top-1/2 -translate-y-1/2 w-10 h-10 items-center justify-center rounded-full bg-white border border-gray-200 shadow-sm text-gray-400 hover:text-gray-700 hover:shadow-md transition-all z-10"
          title="Passer (←)"
        >
          ←
        </button>
        <button
          onClick={() => current && openRelancer(current)}
          className="hidden sm:flex absolute -right-14 top-1/2 -translate-y-1/2 w-10 h-10 items-center justify-center rounded-full bg-indigo-600 shadow-sm text-white hover:bg-indigo-700 hover:shadow-md transition-all z-10"
          title="Relancer (→)"
        >
          →
        </button>

        {/* Carte suivante (derrière) */}
            {next && (
              <div className="absolute inset-x-0 top-3 mx-3 bg-white border border-gray-200 rounded-2xl shadow-sm opacity-60 scale-95 pointer-events-none" style={{ height: '260px' }} />
            )}

            {/* Carte courante */}
            {current && colors && (
              <div
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
                style={{
                  transform: exiting
                    ? `translateX(${swipeDir === 'right' ? '110%' : '-110%'}) rotate(${swipeDir === 'right' ? '8deg' : '-8deg'})`
                    : `translateX(${swipeX}px) rotate(${swipeX * 0.04}deg)`,
                  transition: exiting || (!swiping && swipeX !== 0) ? 'transform 0.3s ease' : 'none',
                  touchAction: 'pan-y',
                }}
                className={`absolute inset-0 bg-white border border-gray-200 rounded-2xl shadow-lg ${colors.glow} cursor-grab active:cursor-grabbing select-none`}
              >
                {/* Indicateurs swipe */}
                {swipeX > 30 && (
                  <div className="absolute top-4 left-4 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full opacity-90 rotate-[-12deg]">
                    📞 RELANCER
                  </div>
                )}
                {swipeX < -30 && (
                  <div className="absolute top-4 right-4 bg-gray-400 text-white text-xs font-bold px-3 py-1 rounded-full opacity-90 rotate-[12deg]">
                    PASSER →
                  </div>
                )}

                <div className="p-5 h-full flex flex-col">
                  {/* Header carte */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <Link href={`/dossiers/${current.id}`} onClick={e => e.stopPropagation()}
                        className="font-bold text-lg text-gray-900 hover:underline truncate block">
                        {current.societe}
                      </Link>
                      <div className="text-xs text-gray-400 mt-0.5">{contextLabel(current.jours_retard)}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-bold text-xl text-gray-900">{formatMontant(current.montant_total)}</div>
                      <div className={`text-xs font-semibold px-2 py-0.5 rounded-md border mt-1 ${colors.badge}`}>
                        {current.jours_retard}j de retard
                      </div>
                    </div>
                  </div>

                  {/* Barre retard */}
                  <div className="h-1.5 bg-gray-100 rounded-full mb-4 overflow-hidden">
                    <div className={`h-full rounded-full ${colors.bar}`}
                      style={{ width: `${Math.min(100, (current.jours_retard / 180) * 100)}%` }} />
                  </div>

                  {/* Statut */}
                  <div className="mb-4">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${getStatutDossierColor(current.statut)}`}>
                      {getStatutDossierLabel(current.statut)}
                    </span>
                    {current.contact && (
                      <span className="text-xs text-gray-400 ml-2">👤 {current.contact.prenom} {current.contact.nom}</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-auto grid grid-cols-2 gap-3">
                    <Link
                      href={`/qualifier?id=${current.id}`}
                      onClick={e => e.stopPropagation()}
                      className="flex items-center justify-center gap-2 py-3.5 bg-white border-2 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 text-gray-700 hover:text-indigo-700 rounded-xl transition-all font-semibold text-sm"
                    >
                      <span className="text-lg">🎯</span> Enrichir
                    </Link>
                    <button
                      onClick={() => openRelancer(current)}
                      className="flex items-center justify-center gap-2 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors font-semibold text-sm shadow-sm"
                    >
                      <span className="text-lg">⚡</span> Relancer
                    </button>
                  </div>
                </div>

                {/* Hint swipe mobile */}
                <div className="absolute bottom-2 left-0 right-0 flex justify-center">
                  <div className="text-xs text-gray-300 select-none">← passer · relancer →</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Compteur restant */}
        {urgences.length > 1 && (
          <div className="flex justify-center gap-1.5 mt-3">
            {urgences.slice(0, Math.min(5, urgences.length)).map((d, i) => (
              <div key={d.id} className={`h-1.5 rounded-full transition-all ${i === 0 ? 'w-4 bg-indigo-500' : 'w-1.5 bg-gray-200'}`} />
            ))}
            {urgences.length > 5 && <div className="text-xs text-gray-400">+{urgences.length - 5}</div>}
          </div>
        )}
      </section>

      {/* Modal relancer */}
      {modalDossier && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold text-gray-900">{modalDossier.societe}</div>
                <div className="text-xs text-gray-400">{modalDossier.jours_retard}j de retard · {formatMontant(modalDossier.montant_total)}</div>
              </div>
              <button onClick={() => setModalDossier(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setModalType('appel')}
                className={`py-2.5 rounded-xl border text-sm font-medium transition-all ${modalType === 'appel' ? 'bg-indigo-50 border-indigo-300 text-indigo-600' : 'border-gray-200 text-gray-500'}`}>
                📞 Appel
              </button>
              <button onClick={() => setModalType('email')}
                className={`py-2.5 rounded-xl border text-sm font-medium transition-all ${modalType === 'email' ? 'bg-indigo-50 border-indigo-300 text-indigo-600' : 'border-gray-200 text-gray-500'}`}>
                ✉️ Email
              </button>
            </div>
            {modalType === 'email' && (
              <div className="grid grid-cols-3 gap-2">
                {(['cordial', 'ferme', 'mise_en_demeure'] as const).map(n => (
                  <button key={n} onClick={() => setModalNiveau(n)}
                    className={`py-2 rounded-xl border text-xs font-medium transition-all ${
                      modalNiveau === n
                        ? n === 'mise_en_demeure' ? 'bg-red-50 border-red-300 text-red-600'
                          : n === 'ferme' ? 'bg-orange-50 border-orange-300 text-orange-600'
                          : 'bg-blue-50 border-blue-300 text-blue-600'
                        : 'border-gray-200 text-gray-500'
                    }`}>
                    {n === 'cordial' ? 'Cordial' : n === 'ferme' ? 'Ferme' : 'Mise en demeure'}
                  </button>
                ))}
              </div>
            )}
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wider font-medium">Statut</label>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { value: 'resolu', label: 'R\u00e9solu', emoji: '🎉', color: 'bg-emerald-50 border-emerald-300 text-emerald-700' },
                  { value: 'promesse', label: 'Promesse', emoji: '🤝', color: 'bg-blue-50 border-blue-300 text-blue-700' },
                  { value: 'en_attente', label: 'En attente', emoji: '⏳', color: 'bg-yellow-50 border-yellow-300 text-yellow-700' },
                  { value: 'a_relancer', label: '\u00c0 relancer', emoji: '🔄', color: 'bg-gray-50 border-gray-300 text-gray-700' },
                ] as const).map(s => (
                  <button key={s.value} onClick={() => setModalStatut(modalStatut === s.value ? null : s.value)}
                    className={`py-2 rounded-xl border text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
                      modalStatut === s.value ? s.color : 'border-gray-200 text-gray-400'
                    }`}>
                    <span>{s.emoji}</span>{s.label}
                  </button>
                ))}
              </div>
            </div>
            <textarea
              value={modalNotes}
              onChange={e => setModalNotes(e.target.value)}
              rows={2}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300"
              placeholder={modalType === 'appel' ? "Il a dit quoi ? Promis quoi ? Invent\u00e9 quoi ?" : "Le contexte, pour s'en souvenir dans 3 semaines."}
            />
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wider font-medium">Rappel (optionnel)</label>
              <input type="datetime-local" value={modalRappel} onChange={e => setModalRappel(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setModalDossier(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600">
                Annuler
              </button>
              <button onClick={handleModalSave} disabled={modalLoading} className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-sm font-semibold text-white transition-colors">
                {modalLoading ? '…' : 'Not\u00e9 →'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
