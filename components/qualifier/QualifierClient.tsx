'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Dossier, Contact } from '@/types'
import { formatMontant } from '@/lib/utils'
import { createClient } from '@/lib/supabase'

interface DossierCard extends Dossier { contact: Contact | null }

export default function QualifierClient({ dossiers }: { dossiers: DossierCard[] }) {
  const [index, setIndex] = useState(0)
  const [form, setForm] = useState({ prenom: '', nom: '', telephone: '', email: '', fonction: '' })
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)

  // Swipe state
  const [swipeDx, setSwipeDx] = useState(0)
  const [swipeDir, setSwipeDir] = useState<'left' | 'right' | null>(null)
  const [isFlying, setIsFlying] = useState(false)
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  const router = useRouter()
  const supabase = createClient()

  const current = dossiers[index]
  const total = dossiers.length
  const pct = total > 0 ? Math.round((index / total) * 100) : 100

  useEffect(() => {
    if (!current) return
    const c = current.contact
    setForm({ prenom: c?.prenom || '', nom: c?.nom || '', telephone: c?.telephone || '', email: c?.email || '', fonction: c?.fonction || '' })
  }, [index, current])

  const flyCard = useCallback((dir: 'left' | 'right', cb: () => void) => {
    setSwipeDir(dir)
    setIsFlying(true)
    setSwipeDx(dir === 'right' ? 400 : -400)
    setTimeout(() => {
      setIsFlying(false)
      setSwipeDx(0)
      setSwipeDir(null)
      cb()
    }, 300)
  }, [])

  const handlePass = useCallback(() => {
    flyCard('left', () => {
      if (index < total - 1) setIndex(i => i + 1)
      else setDone(true)
    })
  }, [index, total, flyCard])

  const handleSave = useCallback(async () => {
    if (!current || saving) return
    setSaving(true)
    const contactData = { ...form, dossier_id: current.id }
    if (current.contact?.id) {
      await supabase.from('contacts').update(form).eq('id', current.contact.id)
    } else {
      await supabase.from('contacts').insert(contactData)
    }
    setSaving(false)
    flyCard('right', () => {
      if (index < total - 1) setIndex(i => i + 1)
      else setDone(true)
    })
  }, [current, form, index, total, saving, supabase, flyCard])

  // Touch handlers
  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }

  function onTouchMove(e: React.TouchEvent) {
    if (touchStartX.current === null) return
    const dx = e.touches[0].clientX - touchStartX.current
    const dy = e.touches[0].clientY - (touchStartY.current ?? 0)
    if (Math.abs(dx) > Math.abs(dy)) {
      setSwipeDx(dx)
      setSwipeDir(dx > 0 ? 'right' : 'left')
    }
  }

  function onTouchEnd() {
    if (Math.abs(swipeDx) > 80) {
      if (swipeDx > 0) handleSave()
      else handlePass()
    } else {
      setSwipeDx(0)
      setSwipeDir(null)
    }
    touchStartX.current = null
  }

  // Keyboard
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSave() }
      if (e.key === 'Escape') handlePass()
      if (e.key === 'ArrowRight') handlePass()
      if (e.key === 'ArrowLeft' && index > 0) setIndex(i => i - 1)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleSave, handlePass, index])

  if (total === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-center p-8">
        <div>
          <div className="text-6xl mb-6">🎉</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Aucun dossier à qualifier</h2>
          <p className="text-gray-500">Commencez par importer des factures.</p>
        </div>
      </div>
    )
  }

  if (done) {
    return (
      <div className="flex-1 flex items-center justify-center text-center p-8">
        <div>
          <div className="text-6xl mb-6">✅</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Session terminée !</h2>
          <p className="text-gray-500 mb-6">Tous les dossiers ont été traités.</p>
          <button onClick={() => router.push('/dashboard')} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium">
            Retour au tableau de bord
          </button>
        </div>
      </div>
    )
  }

  const hasContact = !!(form.prenom || form.nom || form.email || form.telephone)
  const rotation = Math.min(Math.max(swipeDx / 20, -15), 15)
  const opacity = Math.max(1 - Math.abs(swipeDx) / 300, 0.6)

  return (
    <div className="flex-1 flex flex-col bg-gray-50">

      {/* Progress bar */}
      <div className="px-6 py-4 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Qualification contacts</span>
          <span className="text-xs text-gray-400 font-mono">{index + 1} / {total}</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Swipe hints mobile */}
      <div className="flex justify-between px-8 pt-3 pb-0 sm:hidden">
        <div className={`text-xs font-semibold transition-opacity ${swipeDir === 'left' ? 'opacity-100 text-red-500' : 'opacity-20 text-gray-400'}`}>
          ← Passer
        </div>
        <div className={`text-xs font-semibold transition-opacity ${swipeDir === 'right' ? 'opacity-100 text-emerald-500' : 'opacity-20 text-gray-400'}`}>
          Sauvegarder →
        </div>
      </div>

      {/* Main card */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-lg">

          {/* Swipe overlay indicators */}
          <div className="relative">
            {swipeDir === 'right' && Math.abs(swipeDx) > 30 && (
              <div className="absolute top-4 left-4 z-10 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-lg rotate-[-12deg] opacity-90">
                SAUVEGARDER ✓
              </div>
            )}
            {swipeDir === 'left' && Math.abs(swipeDx) > 30 && (
              <div className="absolute top-4 right-4 z-10 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-lg rotate-[12deg] opacity-90">
                PASSER →
              </div>
            )}

            <div
              ref={cardRef}
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
              className="animate-slide-up select-none"
              style={{
                transform: `translateX(${swipeDx}px) rotate(${rotation}deg)`,
                opacity,
                transition: isFlying ? 'transform 0.3s ease, opacity 0.3s ease' : swipeDx === 0 ? 'transform 0.2s ease, opacity 0.2s ease' : 'none',
                touchAction: 'pan-y',
                cursor: swipeDx !== 0 ? 'grabbing' : 'grab',
              }}
            >
              <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-lg">

                {/* Card header */}
                <div className="px-6 sm:px-8 pt-6 sm:pt-8 pb-5 sm:pb-6 border-b border-gray-100 bg-gradient-to-br from-indigo-50 to-white">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-1">Dossier</div>
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">{current.societe}</h2>
                    </div>
                    {!hasContact ? (
                      <span className="flex-shrink-0 px-2 py-1 rounded-lg bg-orange-100 border border-orange-200 text-orange-600 text-xs font-medium">Sans contact</span>
                    ) : (
                      <span className="flex-shrink-0 px-2 py-1 rounded-lg bg-emerald-100 border border-emerald-200 text-emerald-600 text-xs font-medium">Qualifié</span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-4">
                    <div>
                      <div className="text-xl sm:text-2xl font-bold montant-display text-gray-900">{formatMontant(current.montant_total)}</div>
                      <div className="text-xs text-gray-400">à recouvrer</div>
                    </div>
                    {current.jours_retard > 0 && (
                      <div className="text-right">
                        <div className={`text-lg font-bold ${current.jours_retard > 60 ? 'text-red-500' : 'text-orange-500'}`}>{current.jours_retard}j</div>
                        <div className="text-xs text-gray-400">de retard</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Contact form */}
                <div className="px-6 sm:px-8 py-5 sm:py-6 space-y-3 sm:space-y-4">
                  <div className="text-xs text-gray-500 uppercase tracking-wider font-medium">Contact comptabilité</div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Prénom</label>
                      <input value={form.prenom} onChange={e => setForm(p => ({ ...p, prenom: e.target.value }))} className="input-base" placeholder="Marie" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Nom</label>
                      <input value={form.nom} onChange={e => setForm(p => ({ ...p, nom: e.target.value }))} className="input-base" placeholder="Dupont" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Téléphone</label>
                    <input value={form.telephone} onChange={e => setForm(p => ({ ...p, telephone: e.target.value }))} className="input-base" placeholder="06 12 34 56 78" type="tel" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Email</label>
                    <input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="input-base" placeholder="compta@entreprise.fr" type="email" />
                  </div>
                </div>

                {/* Actions */}
                <div className="px-6 sm:px-8 pb-6 sm:pb-8 flex gap-3">
                  <button onClick={handlePass} className="flex-1 py-3 rounded-2xl border border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-50 font-medium text-sm flex items-center justify-center gap-2">
                    <span>→</span> Passer
                    <span className="hidden sm:inline text-xs text-gray-300 ml-1">Échap</span>
                  </button>
                  <button onClick={handleSave} disabled={saving} className="flex-grow-[2] py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm disabled:opacity-50 flex items-center justify-center gap-2">
                    {saving ? '…' : '✓ Enregistrer'}
                    <span className="hidden sm:inline text-xs text-indigo-300 ml-1">Entrée</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation dots */}
      <div className="flex items-center justify-center gap-1.5 py-4 flex-wrap px-4">
        {dossiers.slice(0, 20).map((_, i) => (
          <button key={i} onClick={() => setIndex(i)}
            className={`rounded-full transition-all ${i === index ? 'w-6 h-2 bg-indigo-500' : i < index ? 'w-2 h-2 bg-emerald-400' : 'w-2 h-2 bg-gray-300 hover:bg-gray-400'}`}
          />
        ))}
        {total > 20 && <span className="text-xs text-gray-400">+{total - 20}</span>}
      </div>

      <div className="text-center pb-4 text-xs text-gray-400 hidden sm:block">
        ← Précédent · Entrée = Sauvegarder · Échap = Passer · → Suivant
      </div>
      <div className="text-center pb-4 text-xs text-gray-400 sm:hidden">
        Glisse à droite pour sauvegarder · à gauche pour passer
      </div>
    </div>
  )
}
