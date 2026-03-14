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

function CardStack({
  title, emoji, color, count, children, onPrev, onNext, labelLeft, labelRight
}: {
  title: string, emoji: string, color: string, count: number, children: React.ReactNode,
  onPrev?: () => void, onNext?: () => void, labelLeft?: string, labelRight?: string
}) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-base">{emoji}</span>
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{title}</h2>
        <div className="flex-1 h-px bg-gray-100" />
        <span className="text-xs text-gray-400">{count}</span>
      </div>
      <div className="relative" style={{ height: '300px' }}>
        {onPrev && (
          <button onClick={onPrev}
            className="hidden absolute -left-14 top-1/2 -translate-y-1/2 w-10 h-10 items-center justify-center rounded-full bg-white border border-gray-200 shadow-sm text-gray-400 hover:text-gray-700 hover:shadow-md transition-all z-10"
            title={labelLeft}>←</button>
        )}
        {onNext && (
          <button onClick={onNext}
            className={`hidden absolute -right-14 top-1/2 -translate-y-1/2 w-10 h-10 items-center justify-center rounded-full ${color} shadow-sm text-white hover:shadow-md transition-all z-10`}
            title={labelRight}>→</button>
        )}
        {children}
      </div>
    </section>
  )
}

export default function DashboardClient({ dossiers: initialDossiers, rappels, stats }: Props) {
  const [dossiers, setDossiers] = useState(initialDossiers)
  const [skippedEnrich, setSkippedEnrich] = useState<Set<string>>(new Set())
  const [skippedRelance, setSkippedRelance] = useState<Set<string>>(new Set())
  const [rappelsDismissed, setRappelsDismissed] = useState<Set<string>>(new Set())
  const [rappelsOpen, setRappelsOpen] = useState(false)
  const [rappelsShowAll, setRappelsShowAll] = useState(false)
  const [scoreJour, setScoreJour] = useState(0)
  const [streak, setStreak] = useState(0)
  const [streakBroken, setStreakBroken] = useState(false)

  // Modal relancer
  const [modalDossier, setModalDossier] = useState<(Dossier & { nb_factures: number }) | null>(null)
  const [modalType, setModalType] = useState<'appel' | 'email'>('appel')
  const [modalNotes, setModalNotes] = useState('')
  const [modalNiveau, setModalNiveau] = useState('cordial')
  const [modalLoading, setModalLoading] = useState(false)
  const [modalRappel, setModalRappel] = useState('')
  const [modalStatut, setModalStatut] = useState<StatutDossier | null>(null)

  // Mode enrichir inline
  const [enrichMode, setEnrichMode] = useState(false)
  const [enrichForm, setEnrichForm] = useState({ prenom: '', nom: '', email: '', telephone: '', fonction: '' })
  const [enrichLoading, setEnrichLoading] = useState(false)

  // Swipe relance
  const [swipeXR, setSwipeXR] = useState(0)
  const [swipingR, setSwipingR] = useState(false)
  const [swipeDirR, setSwipeDirR] = useState<'left' | 'right' | null>(null)
  const [exitingR, setExitingR] = useState(false)
  const startXR = useRef(0)

  // Swipe enrich
  const [swipeXE, setSwipeXE] = useState(0)
  const [swipingE, setSwipingE] = useState(false)
  const [swipeDirE, setSwipeDirE] = useState<'left' | 'right' | null>(null)
  const [exitingE, setExitingE] = useState(false)
  const startXE = useRef(0)

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

  const toEnrich = useMemo(() =>
    [...dossiers].filter(d => !d.contact && d.statut !== 'resolu' && !skippedEnrich.has(d.id))
      .sort((a, b) => b.montant_total - a.montant_total),
    [dossiers, skippedEnrich]
  )
  const toRelance = useMemo(() =>
    [...dossiers].filter(d => d.statut !== 'resolu' && !skippedRelance.has(d.id))
      .sort((a, b) => b.jours_retard - a.jours_retard),
    [dossiers, skippedRelance]
  )

  const currentEnrich = toEnrich[0] || null
  const nextEnrich = toEnrich[1] || null
  const currentRelance = toRelance[0] || null
  const nextRelance = toRelance[1] || null
  const rappelsVisible = rappels.filter(r => !rappelsDismissed.has(r.id))
  const montantFormate = formatMontant(stats.total_montant)

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

  async function markRappelDone(actionId: string) {
    await supabase.from('actions').update({ rappel_fait: true }).eq('id', actionId)
    setRappelsDismissed(prev => new Set(Array.from(prev).concat(actionId)))
    router.refresh()
  }

  // --- ENRICH ---
  function skipEnrich() {
    if (!currentEnrich) return
    setExitingE(true); setSwipeDirE('left')
    setTimeout(() => {
      setSkippedEnrich(prev => new Set(Array.from(prev).concat(currentEnrich.id)))
      setSwipeXE(0); setSwipingE(false); setSwipeDirE(null); setExitingE(false)
      setEnrichMode(false); setEnrichForm({ prenom: '', nom: '', email: '', telephone: '', fonction: '' })
    }, 300)
  }

  async function saveEnrich() {
    if (!currentEnrich) return
    setEnrichLoading(true)
    const { data: contact } = await supabase.from('contacts').insert({
      dossier_id: currentEnrich.id,
      ...enrichForm
    }).select().single()
    if (contact) {
      setDossiers(prev => prev.map(d => d.id === currentEnrich.id ? { ...d, contact } : d))
    }
    setEnrichLoading(false)
    const newScore = scoreJour + 1
    setScoreJour(newScore)
    if (newScore === 1) incrementStreak()
    setExitingE(true); setSwipeDirE('right')
    setTimeout(() => {
      setSkippedEnrich(prev => new Set(Array.from(prev).concat(currentEnrich.id)))
      setSwipeXE(0); setSwipingE(false); setSwipeDirE(null); setExitingE(false)
      setEnrichMode(false); setEnrichForm({ prenom: '', nom: '', email: '', telephone: '', fonction: '' })
    }, 300)
  }

  // --- RELANCE ---
  function skipRelance() {
    if (!currentRelance) return
    setExitingR(true); setSwipeDirR('left')
    setTimeout(() => {
      setSkippedRelance(prev => new Set(Array.from(prev).concat(currentRelance.id)))
      setSwipeXR(0); setSwipingR(false); setSwipeDirR(null); setExitingR(false)
    }, 300)
  }

  function openRelancer(dossier: Dossier & { nb_factures: number }, type: 'appel' | 'email' = 'appel') {
    setModalDossier(dossier); setModalNotes(''); setModalNiveau('cordial')
    setModalType(type); setModalRappel(''); setModalStatut(null)
  }

  async function handleModalSave() {
    if (!modalDossier) return
    setModalLoading(true)
    const { data: membre } = await supabase.from('membres').select('id').single()
    await supabase.from('actions').insert({
      dossier_id: modalDossier.id, type: modalType,
      niveau_email: modalType === 'email' ? modalNiveau : null,
      notes: modalNotes, membre_id: membre?.id, rappel_at: modalRappel || null
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
        setDossiers(prev => prev.map(d => d.id === modalDossier.id ? { ...d, statut: 'resolu' as StatutDossier } : d))
      }
    }
    const newScore = scoreJour + 1
    setScoreJour(newScore)
    if (newScore === 1) incrementStreak()
    setExitingR(true); setSwipeDirR('right')
    setTimeout(() => {
      setSkippedRelance(prev => new Set(Array.from(prev).concat(modalDossier.id)))
      setSwipeXR(0); setSwipingR(false); setSwipeDirR(null); setExitingR(false)
    }, 300)
    setModalLoading(false); setModalDossier(null)
    router.refresh()
  }

  // Keyboard
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (modalDossier || enrichMode) return
      if (e.key === 'ArrowLeft') { skipRelance(); skipEnrich() }
      if (e.key === 'ArrowRight') {
        if (currentRelance) openRelancer(currentRelance)
        if (currentEnrich) setEnrichMode(true)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [currentRelance, currentEnrich, modalDossier, enrichMode])

  const colorsR = currentRelance ? urgenceColor(currentRelance.jours_retard) : null

  return (
    <main className="max-w-2xl mx-auto px-3 sm:px-6 py-6 space-y-6">

      {/* Hero */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
        <div className="text-sm text-gray-400 mb-1">Ton argent qui dort</div>
        <div className="text-4xl font-bold text-gray-900 mb-3">{montantFormate}</div>
        <div className="text-sm text-gray-600 mb-4 leading-snug">{getHeroText(montantFormate)}</div>
        <div className="flex flex-wrap gap-2">
          {scoreJour > 0 && (
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5">
              <span>💪</span>{scoreJour === 1 ? "1 relance aujourd'hui. C'est un d\u00e9but." : `${scoreJour} relances. T'es en feu.`}
            </div>
          )}
          {streak > 0 && (
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-orange-700 bg-orange-50 border border-orange-200 rounded-lg px-3 py-1.5">
              <span>🔥</span>
              {streak < 3 && `${streak} jour${streak > 1 ? 's' : ''} de suite.`}
              {streak >= 3 && streak < 7 && `${streak} jours. T'as pris le pli.`}
              {streak >= 7 && `${streak} jours sans l\u00e2cher.`}
            </div>
          )}
          {scoreJour === 0 && (
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-1.5">
              {stats.a_relancer} client{stats.a_relancer > 1 ? 's' : ''} n'attendent que toi
            </div>
          )}
        </div>
      </div>

      {/* Rappels — collapsible */}
      {rappelsVisible.length > 0 && (
        <section>
          <button
            onClick={() => setRappelsOpen(p => !p)}
            className="w-full flex items-center gap-2 mb-2"
          >
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Rappels ({rappelsVisible.length})
            </h2>
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-400">{rappelsOpen ? '▲ Réduire' : '▼ Voir'}</span>
          </button>
          {rappelsOpen && (
            <div className="space-y-2">
              {rappelsVisible.slice(0, rappelsShowAll ? undefined : 2).map(rappel => (
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
                  <button onClick={() => markRappelDone(rappel.id)} className="px-2.5 py-1 rounded-lg bg-white border border-gray-200 text-xs font-medium text-gray-700">✓ Fait</button>
                </div>
              ))}
              {rappelsVisible.length > 2 && (
                <button onClick={() => setRappelsShowAll(p => !p)} className="w-full text-xs text-gray-400 hover:text-indigo-500 py-1">
                  {rappelsShowAll ? 'Voir moins' : `+ ${rappelsVisible.length - 2} autres rappels`}
                </button>
              )}
            </div>
          )}
        </section>
      )}

      {/* === 2 PILES CÔTE À CÔTE DESKTOP === */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

      {/* === PILE ENRICHIR === */}
      <CardStack
        title={toEnrich.length > 0 ? `${toEnrich.length} \u00e0 enrichir` : 'Tous enrichis 🎉'}
        emoji="🎯" color="bg-indigo-600" count={toEnrich.length}
        onPrev={currentEnrich ? skipEnrich : undefined}
        onNext={currentEnrich && !enrichMode ? () => setEnrichMode(true) : undefined}
        labelLeft="Passer" labelRight="Enrichir"
      >
        {toEnrich.length === 0 ? (
          <div className="absolute inset-0 bg-white border border-gray-200 rounded-2xl flex flex-col items-center justify-center text-center p-6 shadow-sm">
            <div className="text-4xl mb-3">🎉</div>
            <div className="font-semibold text-gray-900">Tous tes dossiers ont un contact.</div>
            <div className="text-sm text-gray-400 mt-1">T'as fait le boulot. Maintenant relance.</div>
          </div>
        ) : currentEnrich && (
          <>
            {nextEnrich && <div className="absolute inset-x-0 top-3 mx-3 bg-white border border-gray-200 rounded-2xl opacity-60 scale-95 pointer-events-none" style={{ height: '280px' }} />}
            <div
              onTouchStart={e => { startXE.current = e.touches[0].clientX; setSwipingE(true) }}
              onTouchMove={e => { const dx = e.touches[0].clientX - startXE.current; setSwipeXE(dx); setSwipeDirE(dx > 0 ? 'right' : 'left') }}
              onTouchEnd={() => {
                if (Math.abs(swipeXE) > 80) { if (swipeDirE === 'left') skipEnrich(); else setEnrichMode(true) }
                else { setSwipeXE(0); setSwipeDirE(null) }
                setSwipingE(false)
              }}
              style={{
                transform: exitingE
                  ? `translateX(${swipeDirE === 'right' ? '110%' : '-110%'}) rotate(${swipeDirE === 'right' ? '8deg' : '-8deg'})`
                  : `translateX(${swipeXE}px) rotate(${swipeXE * 0.04}deg)`,
                transition: exitingE || (!swipingE && swipeXE !== 0) ? 'transform 0.3s ease' : 'none',
                touchAction: 'pan-y',
              }}
              className="absolute inset-0 bg-white border border-gray-200 rounded-2xl shadow-lg cursor-grab active:cursor-grabbing select-none"
            >
              {swipeXE > 30 && <div className="absolute top-4 left-4 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full rotate-[-12deg]">🎯 ENRICHIR</div>}
              {swipeXE < -30 && <div className="absolute top-4 right-4 bg-gray-400 text-white text-xs font-bold px-3 py-1 rounded-full rotate-[12deg]">PASSER →</div>}
              <div className="p-5 h-full flex flex-col">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <Link href={`/dossiers/${currentEnrich.id}`} onClick={e => e.stopPropagation()} className="font-bold text-lg text-gray-900 hover:underline">
                      {currentEnrich.societe}
                    </Link>
                    <div className="text-xs text-gray-400 mt-0.5">Pas encore de contact connu</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-xl text-gray-900">{formatMontant(currentEnrich.montant_total)}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{currentEnrich.jours_retard}j</div>
                  </div>
                </div>

                {!enrichMode ? (
                  <>
                    <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
                      <div className="text-4xl mb-3">👤</div>
                      <div className="text-sm text-gray-600 font-medium">Qui tu vas harceler chez {currentEnrich.societe} ?</div>
                      <div className="text-xs text-gray-400 mt-1">Sans contact, pas de relance. Simple.</div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-auto">
                      <button onClick={skipEnrich}
                        className="flex items-center justify-center gap-2 py-3.5 bg-white border-2 border-gray-200 hover:border-gray-300 text-gray-400 rounded-xl font-semibold text-sm transition-all">
                        ⏭️ Passer
                      </button>
                      <button onClick={() => setEnrichMode(true)}
                        className="flex items-center justify-center gap-2 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm shadow-sm transition-colors">
                        🎯 Enrichir
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col gap-2 overflow-auto">
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { key: 'prenom', label: 'Pr\u00e9nom', placeholder: 'Marie' },
                        { key: 'nom', label: 'Nom', placeholder: 'Dupont' },
                      ].map(f => (
                        <div key={f.key}>
                          <label className="block text-xs text-gray-400 mb-0.5">{f.label}</label>
                          <input value={enrichForm[f.key as keyof typeof enrichForm]} onChange={e => setEnrichForm(p => ({ ...p, [f.key]: e.target.value }))}
                            placeholder={f.placeholder}
                            className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                        </div>
                      ))}
                    </div>
                    {[
                      { key: 'email', label: 'Email', placeholder: 'marie@entreprise.fr', type: 'email' },
                      { key: 'telephone', label: 'T\u00e9l', placeholder: '06 00 00 00 00', type: 'tel' },
                      { key: 'fonction', label: 'Fonction', placeholder: 'DAF, PDG...', type: 'text' },
                    ].map(f => (
                      <div key={f.key}>
                        <label className="block text-xs text-gray-400 mb-0.5">{f.label}</label>
                        <input type={f.type} value={enrichForm[f.key as keyof typeof enrichForm]} onChange={e => setEnrichForm(p => ({ ...p, [f.key]: e.target.value }))}
                          placeholder={f.placeholder}
                          className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                      </div>
                    ))}
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <button onClick={() => setEnrichMode(false)}
                        className="py-2.5 border border-gray-200 rounded-xl text-sm text-gray-500 hover:bg-gray-50">Retour</button>
                      <button onClick={saveEnrich} disabled={enrichLoading || (!enrichForm.prenom && !enrichForm.email)}
                        className="py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50">
                        {enrichLoading ? '...' : 'Enregistrer →'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <div className="absolute bottom-2 left-0 right-0 flex justify-center">
                <div className="text-xs text-gray-300 select-none">← passer · enrichir →</div>
              </div>
            </div>
          </>
        )}
      </CardStack>

      {/* === PILE RELANCER === */}
      <CardStack
        title={toRelance.length > 0 ? `${toRelance.length} \u00e0 relancer` : 'File vide 🏆'}
        emoji="⚡" color="bg-indigo-600" count={toRelance.length}
        onPrev={currentRelance ? skipRelance : undefined}
        onNext={currentRelance ? () => openRelancer(currentRelance) : undefined}
        labelLeft="Passer" labelRight="Relancer"
      >
        {toRelance.length === 0 ? (
          <div className="absolute inset-0 bg-white border border-gray-200 rounded-2xl flex flex-col items-center justify-center text-center p-6 shadow-sm">
            <div className="text-4xl mb-3">🏆</div>
            <div className="font-semibold text-gray-900">File vide. T'as tout trait\u00e9.</div>
            <div className="text-sm text-gray-400 mt-1">Ou presque. Mais on va faire semblant que c'est bien.</div>
          </div>
        ) : currentRelance && colorsR && (
          <>
            {nextRelance && <div className="absolute inset-x-0 top-3 mx-3 bg-white border border-gray-200 rounded-2xl opacity-60 scale-95 pointer-events-none" style={{ height: '280px' }} />}
            <div
              onTouchStart={e => { startXR.current = e.touches[0].clientX; setSwipingR(true) }}
              onTouchMove={e => { const dx = e.touches[0].clientX - startXR.current; setSwipeXR(dx); setSwipeDirR(dx > 0 ? 'right' : 'left') }}
              onTouchEnd={() => {
                if (Math.abs(swipeXR) > 80) { if (swipeDirR === 'left') skipRelance(); else openRelancer(currentRelance) }
                else { setSwipeXR(0); setSwipeDirR(null) }
                setSwipingR(false)
              }}
              style={{
                transform: exitingR
                  ? `translateX(${swipeDirR === 'right' ? '110%' : '-110%'}) rotate(${swipeDirR === 'right' ? '8deg' : '-8deg'})`
                  : `translateX(${swipeXR}px) rotate(${swipeXR * 0.04}deg)`,
                transition: exitingR || (!swipingR && swipeXR !== 0) ? 'transform 0.3s ease' : 'none',
                touchAction: 'pan-y',
              }}
              className={`absolute inset-0 bg-white border border-gray-200 rounded-2xl shadow-lg ${colorsR.glow} cursor-grab active:cursor-grabbing select-none`}
            >
              {swipeXR > 30 && <div className="absolute top-4 left-4 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full rotate-[-12deg]">⚡ RELANCER</div>}
              {swipeXR < -30 && <div className="absolute top-4 right-4 bg-gray-400 text-white text-xs font-bold px-3 py-1 rounded-full rotate-[12deg]">PASSER →</div>}
              <div className="p-5 h-full flex flex-col">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <Link href={`/dossiers/${currentRelance.id}`} onClick={e => e.stopPropagation()} className="font-bold text-lg text-gray-900 hover:underline truncate block">
                      {currentRelance.societe}
                    </Link>
                    <div className="text-xs text-gray-400 mt-0.5">{contextLabel(currentRelance.jours_retard)}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-bold text-xl text-gray-900">{formatMontant(currentRelance.montant_total)}</div>
                    <div className={`text-xs font-semibold px-2 py-0.5 rounded-md border mt-1 ${colorsR.badge}`}>{currentRelance.jours_retard}j</div>
                  </div>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full mb-3 overflow-hidden">
                  <div className={`h-full rounded-full ${colorsR.bar}`} style={{ width: `${Math.min(100, (currentRelance.jours_retard / 180) * 100)}%` }} />
                </div>
                <div className="mb-3 flex items-center gap-2">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${getStatutDossierColor(currentRelance.statut)}`}>
                    {getStatutDossierLabel(currentRelance.statut)}
                  </span>
                  {currentRelance.contact && (
                    <span className="text-xs text-gray-400">👤 {currentRelance.contact.prenom} {currentRelance.contact.nom}</span>
                  )}
                </div>
                <div className="mt-auto grid grid-cols-3 gap-2">
                  <button onClick={() => openRelancer(currentRelance, 'appel')}
                    className="flex flex-col items-center gap-1.5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors">
                    <span className="text-lg">📞</span><span className="text-xs font-semibold">Appel</span>
                  </button>
                  <button onClick={() => openRelancer(currentRelance, 'email')}
                    className="flex flex-col items-center gap-1.5 py-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl transition-colors">
                    <span className="text-lg">✉️</span><span className="text-xs font-semibold">Email</span>
                  </button>
                  <button onClick={skipRelance}
                    className="flex flex-col items-center gap-1.5 py-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-400 rounded-xl transition-colors">
                    <span className="text-lg">⏭️</span><span className="text-xs font-semibold">Passer</span>
                  </button>
                </div>
              </div>
              <div className="absolute bottom-2 left-0 right-0 flex justify-center">
                <div className="text-xs text-gray-300 select-none">← passer · relancer →</div>
              </div>
            </div>
          </>
        )}
      </CardStack>

      </div>{/* fin grid 2 colonnes */}

      {/* Liens reset */}
      <div className="flex justify-center gap-6 text-xs text-gray-300">
        {skippedEnrich.size > 0 && <button onClick={() => setSkippedEnrich(new Set())} className="hover:text-indigo-500">Revoir {skippedEnrich.size} pass\u00e9{skippedEnrich.size > 1 ? 's' : ''} (enrichir)</button>}
        {skippedRelance.size > 0 && <button onClick={() => setSkippedRelance(new Set())} className="hover:text-indigo-500">Revoir {skippedRelance.size} pass\u00e9{skippedRelance.size > 1 ? 's' : ''} (relance)</button>}
      </div>

      {/* Modal relancer */}
      {modalDossier && (
        <ModalRelancer
          dossier={modalDossier}
          initialType={modalType}
          onClose={() => setModalDossier(null)}
          onSaved={() => {
            const newScore = scoreJour + 1
            setScoreJour(newScore)
            if (newScore === 1) incrementStreak()
            setExitingR(true); setSwipeDirR('right')
            setTimeout(() => {
              setSkippedRelance(prev => new Set(Array.from(prev).concat(modalDossier!.id)))
              setSwipeXR(0); setSwipingR(false); setSwipeDirR(null); setExitingR(false)
            }, 300)
            setModalDossier(null)
            router.refresh()
          }}
        />
      )}

    </main>
  )
}

// ---- Composant Modal Relancer réutilisable ----
function ModalRelancer({
  dossier, initialType, onClose, onSaved
}: {
  dossier: Dossier & { nb_factures: number }
  initialType: 'appel' | 'email'
  onClose: () => void
  onSaved: () => void
}) {
  const supabase = createClient()
  const [type, setType] = useState<'appel' | 'email'>(initialType)

  // Appel state
  const [notes, setNotes] = useState('')
  const [statut, setStatut] = useState<StatutDossier | null>(null)
  const [rappel, setRappel] = useState('')
  const [loading, setLoading] = useState(false)

  // Email state — étape 1
  const [emailDest, setEmailDest] = useState(dossier.contact?.email || '')
  const [niveau, setNiveau] = useState<'cordial' | 'ferme' | 'mise_en_demeure'>('cordial')
  const [emailNotes, setEmailNotes] = useState('')
  // Email state — étape 2 preview
  const [emailStep, setEmailStep] = useState<'compose' | 'preview'>('compose')
  const [emailBody, setEmailBody] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [sendError, setSendError] = useState('')

  const TEXTES = {
    cordial: `Madame, Monsieur,

Sauf erreur de notre part, nous constatons qu'une facture d'un montant de ${dossier.montant_total.toFixed(2)} € reste à ce jour impayée.

Nous vous serions reconnaissants de bien vouloir procéder au règlement de cette somme dans les meilleurs délais.

Cordialement,`,
    ferme: `Madame, Monsieur,

Malgré notre précédent rappel, nous constatons que la somme de ${dossier.montant_total.toFixed(2)} € n'a toujours pas été réglée.

Nous vous mettons en demeure de procéder au paiement dans un délai de 8 jours.

Cordialement,`,
    mise_en_demeure: `Madame, Monsieur,

En l'absence de règlement, nous vous adressons la présente mise en demeure de régler la somme de ${dossier.montant_total.toFixed(2)} € dans un délai de 48 heures.

Passé ce délai, une procédure judiciaire sera engagée.`,
  }

  async function handleAppelSave() {
    setLoading(true)
    const { data: membre } = await supabase.from('membres').select('id').single()
    await supabase.from('actions').insert({
      dossier_id: dossier.id, type: 'appel',
      notes, membre_id: membre?.id, rappel_at: rappel || null
    })
    if (statut) {
      await supabase.from('dossiers').update({ statut }).eq('id', dossier.id)
      if (statut === 'resolu') {
        const s = document.createElement('script')
        s.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.2/dist/confetti.browser.min.js'
        s.onload = () => { (window as any).confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ['#6366F1', '#10B981', '#F59E0B'] }) }
        document.head.appendChild(s)
      }
    }
    setLoading(false)
    onSaved()
  }

  async function handleEmailSend() {
    setSending(true)
    setSendError('')
    const res = await fetch('/api/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dossier_id: dossier.id, niveau, email_destinataire: emailDest, notes: emailNotes, body_override: emailBody }),
    })
    if (!res.ok) {
      const err = await res.json()
      setSendError(err.error || "Erreur lors de l'envoi")
      setSending(false)
      return
    }
    const { data: membre } = await supabase.from('membres').select('id').single()
    await supabase.from('actions').insert({
      dossier_id: dossier.id, type: 'email', niveau_email: niveau,
      notes: (emailNotes || '') + (emailDest ? ' — envoyé à ' + emailDest : ''),
      membre_id: membre?.id
    })
    setSending(false)
    setSent(true)
    setTimeout(() => onSaved(), 1000)
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl p-5 space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="font-bold text-gray-900">{dossier.societe}</div>
            <div className="text-xs text-gray-400">{dossier.jours_retard}j de retard · {formatMontant(dossier.montant_total)}</div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>

        {/* Toggle Appel / Email — seulement sur étape 1 */}
        {emailStep === 'compose' && (
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setType('appel')}
              className={`py-2.5 rounded-xl border text-sm font-medium transition-all ${type === 'appel' ? 'bg-indigo-50 border-indigo-300 text-indigo-600' : 'border-gray-200 text-gray-500'}`}>
              📞 Appel
            </button>
            <button onClick={() => setType('email')}
              className={`py-2.5 rounded-xl border text-sm font-medium transition-all ${type === 'email' ? 'bg-indigo-50 border-indigo-300 text-indigo-600' : 'border-gray-200 text-gray-500'}`}>
              ✉️ Email
            </button>
          </div>
        )}

        {/* ---- APPEL ---- */}
        {type === 'appel' && (
          <>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wider">Statut</label>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { value: 'resolu', label: 'Résolu', emoji: '🎉', color: 'bg-emerald-50 border-emerald-300 text-emerald-700' },
                  { value: 'promesse', label: 'Promesse', emoji: '🤝', color: 'bg-blue-50 border-blue-300 text-blue-700' },
                  { value: 'en_attente', label: 'En attente', emoji: '⏳', color: 'bg-yellow-50 border-yellow-300 text-yellow-700' },
                  { value: 'a_relancer', label: 'À relancer', emoji: '🔄', color: 'bg-gray-50 border-gray-300 text-gray-700' },
                ] as const).map(s => (
                  <button key={s.value} onClick={() => setStatut(statut === s.value ? null : s.value)}
                    className={`py-2 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${statut === s.value ? s.color : 'border-gray-200 text-gray-400'}`}>
                    {s.emoji} {s.label}
                  </button>
                ))}
              </div>
            </div>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              placeholder="Il a dit quoi ? Promis quoi ? Inventé quoi ?"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300" />
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wider">Rappel (optionnel)</label>
              <input type="datetime-local" value={rappel} onChange={e => setRappel(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
            </div>
            <div className="flex gap-2">
              <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600">Annuler</button>
              <button onClick={handleAppelSave} disabled={loading}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold">
                {loading ? '…' : 'Noté →'}
              </button>
            </div>
          </>
        )}

        {/* ---- EMAIL étape 1 : composer ---- */}
        {type === 'email' && emailStep === 'compose' && (
          <>
            <div>
              <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider">Envoyer à</label>
              <input type="email" value={emailDest} onChange={e => setEmailDest(e.target.value)}
                placeholder="client@entreprise.fr"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
              {!emailDest && <p className="text-xs text-amber-500 mt-1">Aucun email de contact.</p>}
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wider">Niveau</label>
              <div className="grid grid-cols-3 gap-2">
                {(['cordial', 'ferme', 'mise_en_demeure'] as const).map(n => (
                  <button key={n} onClick={() => setNiveau(n)}
                    className={`py-2 rounded-xl border text-xs font-medium transition-all ${niveau === n
                      ? n === 'mise_en_demeure' ? 'bg-red-50 border-red-300 text-red-600'
                        : n === 'ferme' ? 'bg-orange-50 border-orange-300 text-orange-600'
                        : 'bg-blue-50 border-blue-300 text-blue-600'
                      : 'border-gray-200 text-gray-500'}`}>
                    {n === 'cordial' ? 'Cordial' : n === 'ferme' ? 'Ferme' : 'Mise en demeure'}
                  </button>
                ))}
              </div>
            </div>
            <textarea value={emailNotes} onChange={e => setEmailNotes(e.target.value)} rows={2}
              placeholder="Le contexte, pour s'en souvenir dans 3 semaines."
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300" />
            <div className="flex gap-2">
              <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600">Annuler</button>
              <button onClick={() => { setEmailBody(TEXTES[niveau]); setEmailStep('preview') }} disabled={!emailDest}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold disabled:opacity-50">
                Voir le mail →
              </button>
            </div>
          </>
        )}

        {/* ---- EMAIL étape 2 : preview éditable ---- */}
        {type === 'email' && emailStep === 'preview' && (
          <>
            <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 rounded-xl px-3 py-2">
              <span>À :</span>
              <span className="font-medium text-gray-700">{emailDest}</span>
              <button onClick={() => setEmailStep('compose')} className="ml-auto text-indigo-600 hover:underline">Modifier</button>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider">Contenu — éditable</label>
              <textarea value={emailBody} onChange={e => setEmailBody(e.target.value)} rows={10}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none leading-relaxed" />
            </div>
            {sendError && <p className="text-xs text-red-500">{sendError}</p>}
            <div className="flex gap-2">
              <button onClick={() => setEmailStep('compose')} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600">Retour</button>
              <button onClick={handleEmailSend} disabled={sending || sent}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold disabled:opacity-50">
                {sending ? 'Envoi...' : sent ? 'Envoyé ✓' : 'Envoyer →'}
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  )
}
