#!/bin/bash
echo "🔧 Correction des couleurs texte + qualifier..."

# 1. Fix DossierClient - tous les textes blancs → gris foncé
cat > components/dossiers/DossierClient.tsx << 'ENDOFFILE'
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Dossier, Facture, Action, Contact, StatutDossier, StatutFacture, ResultatAppel, NiveauEmail } from '@/types'
import { formatMontant, formatDate, getStatutDossierLabel, getStatutDossierColor, getStatutFactureLabel, getStatutFactureColor, getResultatLabel, getNiveauEmailLabel, toDateString, addDays } from '@/lib/utils'
import { createClient } from '@/lib/supabase'

interface Props {
  dossier: Dossier & {
    factures: Facture[]
    contact: Contact | null
    actions: (Action & { membre?: any })[]
  }
}

type Modal = 'appel' | 'email' | 'contact' | null

export default function DossierClient({ dossier: initial }: Props) {
  const [dossier, setDossier] = useState(initial)
  const [modal, setModal] = useState<Modal>(null)
  const router = useRouter()
  const supabase = createClient()

  async function updateStatut(statut: StatutDossier) {
    await supabase.from('dossiers').update({ statut }).eq('id', dossier.id)
    setDossier(prev => ({ ...prev, statut }))
    router.refresh()
  }

  async function updateFactureStatut(factureId: string, statut: StatutFacture) {
    await supabase.from('factures').update({ statut }).eq('id', factureId)
    setDossier(prev => ({ ...prev, factures: prev.factures.map(f => f.id === factureId ? { ...f, statut } : f) }))
    router.refresh()
  }

  async function markRappelDone(actionId: string) {
    await supabase.from('actions').update({ rappel_fait: true }).eq('id', actionId)
    setDossier(prev => ({ ...prev, actions: prev.actions.map(a => a.id === actionId ? { ...a, rappel_fait: true } : a) }))
  }

  function onActionAdded(action: Action) {
    setDossier(prev => ({ ...prev, actions: [action, ...prev.actions] }))
    setModal(null)
    router.refresh()
  }

  function onContactSaved(contact: Contact) {
    setDossier(prev => ({ ...prev, contact }))
    setModal(null)
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link href="/dashboard" className="hover:text-gray-700">Tableau de bord</Link>
        <span>/</span>
        <span className="text-gray-700">{dossier.societe}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
        <div className="flex items-center gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{dossier.societe}</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-gray-500 text-sm">{dossier.jours_retard > 0 ? `${dossier.jours_retard}j de retard` : 'À jour'}</span>
              {dossier.jours_retard > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${dossier.jours_retard > 60 ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                  {dossier.jours_retard > 60 ? 'CRITIQUE' : 'RETARD'}
                </span>
              )}
            </div>
          </div>
          <select
            value={dossier.statut}
            onChange={e => updateStatut(e.target.value as StatutDossier)}
            className="border rounded-lg px-3 py-1.5 text-xs font-medium bg-white text-gray-700 border-gray-200 focus:outline-none focus:border-blue-400 cursor-pointer"
          >
            <option value="a_relancer">À relancer</option>
            <option value="en_attente">En attente</option>
            <option value="promesse">Promesse</option>
            <option value="resolu">Résolu</option>
          </select>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold montant-display text-gray-900">{formatMontant(dossier.montant_total)}</div>
          <div className="text-sm text-gray-400">{dossier.factures?.length || 0} facture(s)</div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 mb-8">
        <button onClick={() => setModal('appel')} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium">
          <span>📞</span> Noter un appel
        </button>
        <button onClick={() => setModal('email')} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-sm font-medium">
          <span>✉️</span> Envoyer un mail
        </button>
      </div>

      {/* 2-column layout */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">

          {/* Factures */}
          <section className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-sm text-gray-900">Factures</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {dossier.factures?.map(facture => (
                <div key={facture.id} className="px-5 py-3 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900">{facture.numero || 'N/A'}</div>
                    <div className="text-xs text-gray-400">
                      {facture.date_facture ? `Émise le ${formatDate(facture.date_facture)}` : ''}
                      {facture.date_echeance ? ` · Échéance ${formatDate(facture.date_echeance)}` : ''}
                    </div>
                  </div>
                  <div className="font-mono text-sm font-semibold text-gray-900">{formatMontant(facture.montant_ttc)}</div>
                  <select
                    value={facture.statut}
                    onChange={e => updateFactureStatut(facture.id, e.target.value as StatutFacture)}
                    className={`border-none rounded-lg px-2 py-1 text-xs font-medium cursor-pointer focus:outline-none ${getStatutFactureColor(facture.statut)}`}
                  >
                    <option value="impayee">Impayée</option>
                    <option value="contestee">Contestée</option>
                    <option value="partiellement_payee">Partielle</option>
                    <option value="payee">Payée</option>
                  </select>
                </div>
              ))}
              {(!dossier.factures || dossier.factures.length === 0) && (
                <div className="px-5 py-8 text-center text-gray-400 text-sm">Aucune facture</div>
              )}
            </div>
          </section>

          {/* Timeline */}
          <section>
            <h2 className="font-semibold text-sm mb-4 text-gray-900">Historique des actions</h2>
            <div className="space-y-3">
              {dossier.actions?.map(action => (
                <TimelineItem key={action.id} action={action} onMarkDone={() => markRappelDone(action.id)} />
              ))}
              {(!dossier.actions || dossier.actions.length === 0) && (
                <div className="text-center py-10 text-gray-400 text-sm">Aucune action enregistrée</div>
              )}
            </div>
          </section>
        </div>

        {/* Contact */}
        <div>
          <div className="bg-white border border-gray-200 rounded-2xl p-5 sticky top-20 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-sm text-gray-900">Contact comptabilité</h2>
              <button onClick={() => setModal('contact')} className="text-xs text-blue-600 hover:text-blue-700">
                {dossier.contact ? 'Modifier' : 'Ajouter'}
              </button>
            </div>
            {dossier.contact ? (
              <div className="space-y-3">
                <div>
                  <div className="font-semibold text-gray-900">{dossier.contact.prenom} {dossier.contact.nom}</div>
                  {dossier.contact.fonction && <div className="text-xs text-gray-400">{dossier.contact.fonction}</div>}
                </div>
                {dossier.contact.email && (
                  <a href={`mailto:${dossier.contact.email}`} className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700">
                    <span>✉️</span> {dossier.contact.email}
                  </a>
                )}
                {dossier.contact.telephone && (
                  <a href={`tel:${dossier.contact.telephone}`} className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900">
                    <span>📞</span> {dossier.contact.telephone}
                  </a>
                )}
              </div>
            ) : (
              <button onClick={() => setModal('contact')} className="w-full py-6 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 text-sm hover:border-blue-300 hover:text-blue-500 transition-colors">
                + Ajouter un contact
              </button>
            )}
          </div>
        </div>
      </div>

      {modal === 'appel' && <ModalAppel dossierId={dossier.id} onClose={() => setModal(null)} onSaved={onActionAdded} />}
      {modal === 'email' && <ModalEmail dossierId={dossier.id} onClose={() => setModal(null)} onSaved={onActionAdded} />}
      {modal === 'contact' && <ModalContact dossierId={dossier.id} contact={dossier.contact} onClose={() => setModal(null)} onSaved={onContactSaved} />}
    </main>
  )
}

function TimelineItem({ action, onMarkDone }: { action: Action & { membre?: any }; onMarkDone: () => void }) {
  const icons: Record<string, string> = { appel: '📞', email: '✉️', note: '📝', import: '📥' }
  return (
    <div className="relative flex gap-4 pb-3">
      <div className="timeline-line flex-shrink-0">
        <div className="w-6 h-6 rounded-full bg-gray-100 border-2 border-gray-200 flex items-center justify-center text-xs">
          {icons[action.type]}
        </div>
      </div>
      <div className="flex-1 min-w-0 bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <span className="text-xs font-medium text-gray-700 capitalize">{action.type}</span>
            {action.resultat && <span className="ml-2 text-xs text-gray-500">· {getResultatLabel(action.resultat)}</span>}
            {action.niveau_email && <span className="ml-2 text-xs text-gray-500">· {getNiveauEmailLabel(action.niveau_email)}</span>}
          </div>
          <span className="text-xs text-gray-400">{formatDate(action.created_at)}</span>
        </div>
        {action.notes && <p className="text-sm text-gray-700 mt-1">{action.notes}</p>}
        {action.rappel_le && !action.rappel_fait && (
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
            <span className="text-xs text-amber-600">📅 Rappel: {formatDate(action.rappel_le)}</span>
            <button onClick={onMarkDone} className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 hover:bg-emerald-200">✓ Fait</button>
          </div>
        )}
        {action.rappel_le && action.rappel_fait && (
          <div className="mt-2 pt-2 border-t border-gray-100">
            <span className="text-xs text-gray-400 line-through">Rappel: {formatDate(action.rappel_le)}</span>
            <span className="ml-2 text-xs text-emerald-600">✓ Fait</span>
          </div>
        )}
      </div>
    </div>
  )
}

function ModalAppel({ dossierId, onClose, onSaved }: { dossierId: string; onClose: () => void; onSaved: (a: Action) => void }) {
  const [resultat, setResultat] = useState<ResultatAppel>('pas_repondu')
  const [notes, setNotes] = useState('')
  const [rappelLe, setRappelLe] = useState(toDateString(addDays(new Date(), 3)))
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function handleSave() {
    setLoading(true)
    const { data: membre } = await supabase.from('membres').select('id').single()
    const { data } = await supabase.from('actions').insert({ dossier_id: dossierId, type: 'appel', resultat, notes, rappel_le: rappelLe || null, membre_id: membre?.id }).select().single()
    if (data) onSaved(data as Action)
    setLoading(false)
  }

  return (
    <Modal title="📞 Noter un appel" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1.5 uppercase tracking-wider font-medium">Résultat</label>
          <select value={resultat} onChange={e => setResultat(e.target.value as ResultatAppel)} className="input-base">
            <option value="pas_repondu">Pas répondu</option>
            <option value="promesse_paiement">Promesse de paiement</option>
            <option value="conteste">Contesté</option>
            <option value="en_cours_traitement">En cours de traitement</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1.5 uppercase tracking-wider font-medium">Notes</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="input-base resize-none" placeholder="Notes de l'appel…" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1.5 uppercase tracking-wider font-medium">Date de rappel</label>
          <input type="date" value={rappelLe} onChange={e => setRappelLe(e.target.value)} className="input-base" />
        </div>
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 hover:bg-gray-50">Annuler</button>
          <button onClick={handleSave} disabled={loading} className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium disabled:opacity-50">
            {loading ? '…' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

function ModalEmail({ dossierId, onClose, onSaved }: { dossierId: string; onClose: () => void; onSaved: (a: Action) => void }) {
  const [niveau, setNiveau] = useState<NiveauEmail>('cordial')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function handleSave() {
    setLoading(true)
    const { data: membre } = await supabase.from('membres').select('id').single()
    const { data } = await supabase.from('actions').insert({ dossier_id: dossierId, type: 'email', niveau_email: niveau, notes, membre_id: membre?.id }).select().single()
    if (data) onSaved(data as Action)
    setLoading(false)
  }

  return (
    <Modal title="✉️ Envoyer un mail" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1.5 uppercase tracking-wider font-medium">Niveau</label>
          <div className="grid grid-cols-3 gap-2">
            {(['cordial', 'ferme', 'mise_en_demeure'] as NiveauEmail[]).map(n => (
              <button key={n} onClick={() => setNiveau(n)}
                className={`py-2.5 px-3 rounded-xl border text-xs font-medium transition-all ${
                  niveau === n
                    ? n === 'mise_en_demeure' ? 'bg-red-50 border-red-300 text-red-600'
                      : n === 'ferme' ? 'bg-orange-50 border-orange-300 text-orange-600'
                      : 'bg-blue-50 border-blue-300 text-blue-600'
                    : 'border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                }`}>
                {getNiveauEmailLabel(n)}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1.5 uppercase tracking-wider font-medium">Notes internes</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="input-base resize-none" placeholder="Contexte ou suivi…" />
        </div>
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 hover:bg-gray-50">Annuler</button>
          <button onClick={handleSave} disabled={loading} className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium disabled:opacity-50">
            {loading ? '…' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

function ModalContact({ dossierId, contact, onClose, onSaved }: { dossierId: string; contact: Contact | null; onClose: () => void; onSaved: (c: Contact) => void }) {
  const [form, setForm] = useState({ prenom: contact?.prenom || '', nom: contact?.nom || '', email: contact?.email || '', telephone: contact?.telephone || '', fonction: contact?.fonction || '' })
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function handleSave() {
    setLoading(true)
    let data
    if (contact) {
      const res = await supabase.from('contacts').update(form).eq('id', contact.id).select().single()
      data = res.data
    } else {
      const res = await supabase.from('contacts').insert({ ...form, dossier_id: dossierId }).select().single()
      data = res.data
    }
    if (data) onSaved(data as Contact)
    setLoading(false)
  }

  const fields = [
    { key: 'prenom', label: 'Prénom', placeholder: 'Marie' },
    { key: 'nom', label: 'Nom', placeholder: 'Dupont' },
    { key: 'fonction', label: 'Fonction', placeholder: 'Comptable' },
    { key: 'email', label: 'Email', placeholder: 'marie@entreprise.fr' },
    { key: 'telephone', label: 'Téléphone', placeholder: '06 12 34 56 78' },
  ] as const

  return (
    <Modal title="👤 Contact comptabilité" onClose={onClose}>
      <div className="space-y-3">
        {fields.map(f => (
          <div key={f.key}>
            <label className="block text-xs text-gray-500 mb-1.5 uppercase tracking-wider font-medium">{f.label}</label>
            <input type={f.key === 'email' ? 'email' : 'text'} value={form[f.key]} onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))} className="input-base" placeholder={f.placeholder} />
          </div>
        ))}
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 hover:bg-gray-50">Annuler</button>
          <button onClick={handleSave} disabled={loading} className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium disabled:opacity-50">
            {loading ? '…' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop bg-black/30 animate-fade-in">
      <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-md p-6 animate-slide-up shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-700">✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}
ENDOFFILE
echo "✅ DossierClient.tsx"

# 2. Fix Qualifier - fond clair
cat > components/qualifier/QualifierClient.tsx << 'ENDOFFILE'
'use client'

import { useState, useEffect, useCallback } from 'react'
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

  const handlePass = useCallback(() => {
    if (index < total - 1) setIndex(i => i + 1)
    else setDone(true)
  }, [index, total])

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
    if (index < total - 1) setIndex(i => i + 1)
    else setDone(true)
  }, [current, form, index, total, saving, supabase])

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
          <button onClick={() => router.push('/dashboard')} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium">
            Retour au tableau de bord
          </button>
        </div>
      </div>
    )
  }

  const hasContact = !!(form.prenom || form.nom || form.email || form.telephone)

  return (
    <div className="flex-1 flex flex-col bg-gray-50">

      {/* Progress bar */}
      <div className="px-6 py-4 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Qualification contacts</span>
          <span className="text-xs text-gray-400 font-mono">{index + 1} / {total}</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Main card */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-lg animate-slide-up">
          <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-lg">

            {/* Card header */}
            <div className="px-8 pt-8 pb-6 border-b border-gray-100 bg-gradient-to-br from-blue-50 to-white">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-1">Dossier</div>
                  <h2 className="text-2xl font-bold text-gray-900 leading-tight">{current.societe}</h2>
                </div>
                {!hasContact ? (
                  <span className="flex-shrink-0 px-2 py-1 rounded-lg bg-orange-100 border border-orange-200 text-orange-600 text-xs font-medium">Sans contact</span>
                ) : (
                  <span className="flex-shrink-0 px-2 py-1 rounded-lg bg-emerald-100 border border-emerald-200 text-emerald-600 text-xs font-medium">Qualifié</span>
                )}
              </div>
              <div className="flex items-center gap-4 mt-4">
                <div>
                  <div className="text-2xl font-bold montant-display text-gray-900">{formatMontant(current.montant_total)}</div>
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
            <div className="px-8 py-6 space-y-4">
              <div className="text-xs text-gray-500 uppercase tracking-wider font-medium">Contact comptabilité</div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Prénom</label>
                  <input value={form.prenom} onChange={e => setForm(p => ({ ...p, prenom: e.target.value }))} className="input-base" placeholder="Marie" autoFocus />
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
            <div className="px-8 pb-8 flex gap-3">
              <button onClick={handlePass} className="flex-1 py-3 rounded-2xl border border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-50 font-medium text-sm flex items-center justify-center gap-2">
                <span>→</span> Passer
                <span className="text-xs text-gray-300 ml-1">Échap</span>
              </button>
              <button onClick={handleSave} disabled={saving} className="flex-grow-[2] py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm disabled:opacity-50 flex items-center justify-center gap-2">
                {saving ? '…' : '✓ Enregistrer'}
                <span className="text-xs text-blue-300 ml-1">Entrée</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation dots */}
      <div className="flex items-center justify-center gap-1.5 py-6 flex-wrap px-4">
        {dossiers.slice(0, 20).map((_, i) => (
          <button key={i} onClick={() => setIndex(i)}
            className={`rounded-full transition-all ${i === index ? 'w-6 h-2 bg-blue-500' : i < index ? 'w-2 h-2 bg-emerald-400' : 'w-2 h-2 bg-gray-300 hover:bg-gray-400'}`}
          />
        ))}
        {total > 20 && <span className="text-xs text-gray-400">+{total - 20}</span>}
      </div>

      <div className="text-center pb-6 text-xs text-gray-400">
        ← Précédent · Entrée = Sauvegarder · Échap = Passer · → Suivant
      </div>
    </div>
  )
}
ENDOFFILE
echo "✅ QualifierClient.tsx"

# 3. Fix ImportClient colors
cat > components/import/ImportClient.tsx << 'ENDOFFILE'
'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { detectSeparator, detectColumns, parseAmount, formatMontant } from '@/lib/utils'

type Mode = 'csv' | 'pdf' | 'manual'

interface ParsedFacture {
  societe: string; numero: string; montant_ttc: number
  date_facture: string; date_echeance: string; bon_commande: string
  confidence?: 'high' | 'medium' | 'low'; _selected?: boolean
}

export default function ImportClient() {
  const [mode, setMode] = useState<Mode>('csv')
  const [step, setStep] = useState<'upload' | 'map' | 'preview' | 'success'>('upload')
  const [parsed, setParsed] = useState<ParsedFacture[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [rawCsv, setRawCsv] = useState<string[][]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [mapping, setMapping] = useState<Record<string, number>>({})
  const [manual, setManual] = useState<ParsedFacture>({ societe: '', numero: '', montant_ttc: 0, date_facture: '', date_echeance: '', bon_commande: '' })
  const router = useRouter()

  function handleCsvUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const sep = detectSeparator(text)
      const rows = text.split('\n').map(r => r.split(sep).map(c => c.trim().replace(/^"|"$/g, '')))
      const h = rows[0] || []
      setHeaders(h); setRawCsv(rows.slice(1).filter(r => r.some(c => c))); setMapping(detectColumns(h)); setStep('map')
    }
    reader.readAsText(file, 'UTF-8')
  }

  function applyMapping() {
    const rows: ParsedFacture[] = rawCsv.map(row => ({
      societe: mapping.societe !== undefined ? row[mapping.societe] || '' : '',
      numero: mapping.numero !== undefined ? row[mapping.numero] || '' : '',
      montant_ttc: mapping.montant_ttc !== undefined ? parseAmount(row[mapping.montant_ttc] || '0') : 0,
      date_facture: mapping.date_facture !== undefined ? row[mapping.date_facture] || '' : '',
      date_echeance: mapping.date_echeance !== undefined ? row[mapping.date_echeance] || '' : '',
      bon_commande: mapping.bon_commande !== undefined ? row[mapping.bon_commande] || '' : '',
      _selected: true,
    }))
    setParsed(rows); setStep('preview')
  }

  async function handleImport() {
    const toImport = parsed.filter(f => f._selected)
    if (!toImport.length) return
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/dossiers/import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ factures: toImport }) })
      if (!res.ok) throw new Error(await res.text())
      setStep('success')
    } catch (err: any) { setError(err.message || "Erreur lors de l'import.") }
    setLoading(false)
  }

  const FIELDS = [
    { key: 'societe', label: 'Société' }, { key: 'numero', label: 'N° Facture' },
    { key: 'montant_ttc', label: 'Montant TTC' }, { key: 'date_facture', label: 'Date facture' },
    { key: 'date_echeance', label: 'Échéance' }, { key: 'bon_commande', label: 'Bon de commande' },
  ] as const

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Importer des factures</h1>
        <p className="text-gray-500 text-sm">Importez depuis un fichier CSV, PDF ou saisissez manuellement.</p>
      </div>

      {step === 'success' ? (
        <div className="bg-white border border-emerald-200 rounded-2xl p-12 text-center animate-fade-in shadow-sm">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Import réussi !</h2>
          <p className="text-gray-500 mb-6">{parsed.filter(f => f._selected).length} facture(s) importée(s)</p>
          <button onClick={() => router.push('/dashboard')} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium">Voir le tableau de bord</button>
        </div>
      ) : (
        <>
          {step === 'upload' && (
            <div className="flex gap-2 mb-6 bg-gray-100 rounded-xl p-1 w-fit">
              {(['csv', 'pdf', 'manual'] as Mode[]).map(m => (
                <button key={m} onClick={() => setMode(m)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${mode === m ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>
                  {m === 'csv' ? '📊 CSV' : m === 'pdf' ? '📄 PDF' : '✏️ Manuel'}
                </button>
              ))}
            </div>
          )}

          {step === 'upload' && mode === 'csv' && <UploadZone accept=".csv,.tsv,.txt" label="Glissez votre fichier CSV ici" sub="Séparateur auto-détecté (; , tab)" onChange={handleCsvUpload} />}

          {step === 'upload' && mode === 'manual' && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <h2 className="font-semibold text-gray-900 mb-4">Saisie manuelle</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {FIELDS.map(f => (
                  <div key={f.key}>
                    <label className="block text-xs text-gray-500 mb-1.5 uppercase tracking-wider font-medium">{f.label}</label>
                    <input type={f.key.includes('date') ? 'date' : f.key === 'montant_ttc' ? 'number' : 'text'}
                      value={manual[f.key] as string}
                      onChange={e => setManual(prev => ({ ...prev, [f.key]: f.key === 'montant_ttc' ? parseFloat(e.target.value) : e.target.value }))}
                      className="input-base" step={f.key === 'montant_ttc' ? '0.01' : undefined} />
                  </div>
                ))}
              </div>
              <button onClick={() => { setParsed([{ ...manual, _selected: true }]); setStep('preview') }}
                className="mt-6 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium">
                Continuer
              </button>
            </div>
          )}

          {step === 'map' && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-5 shadow-sm animate-slide-up">
              <h2 className="font-semibold text-gray-900">Correspondance des colonnes</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {FIELDS.map(f => (
                  <div key={f.key}>
                    <label className="block text-xs text-gray-500 mb-1.5 uppercase tracking-wider font-medium">{f.label}</label>
                    <select value={mapping[f.key] !== undefined ? mapping[f.key] : ''} onChange={e => setMapping(prev => ({ ...prev, [f.key]: e.target.value !== '' ? parseInt(e.target.value) : undefined as any }))} className="input-base">
                      <option value="">— Ignorer —</option>
                      {headers.map((h, i) => <option key={i} value={i}>{h}</option>)}
                    </select>
                  </div>
                ))}
              </div>
              <div className="border border-gray-200 rounded-xl overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="border-b border-gray-100 bg-gray-50">{headers.map((h, i) => <th key={i} className="px-3 py-2 text-left text-gray-500 font-medium">{h}</th>)}</tr></thead>
                  <tbody>{rawCsv.slice(0, 3).map((row, i) => <tr key={i} className="border-b border-gray-50">{row.map((cell, j) => <td key={j} className="px-3 py-2 text-gray-700">{cell}</td>)}</tr>)}</tbody>
                </table>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep('upload')} className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 hover:bg-gray-50">← Retour</button>
                <button onClick={applyMapping} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium">Prévisualiser ({rawCsv.length} lignes)</button>
              </div>
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-4 animate-slide-up">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">{parsed.filter(f => f._selected).length} facture(s) à importer</h2>
                <div className="flex gap-3">
                  <button onClick={() => setStep(mode === 'csv' ? 'map' : 'upload')} className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 hover:bg-gray-50">← Retour</button>
                  <button onClick={handleImport} disabled={loading || !parsed.some(f => f._selected)} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium disabled:opacity-50">
                    {loading ? 'Import en cours…' : 'Importer'}
                  </button>
                </div>
              </div>
              {error && <p className="text-red-600 text-sm">{error}</p>}
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="px-4 py-3 text-left w-8"><input type="checkbox" checked={parsed.every(f => f._selected)} onChange={e => setParsed(prev => prev.map(f => ({ ...f, _selected: e.target.checked })))} className="accent-blue-600" /></th>
                      <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Société</th>
                      <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">N° Facture</th>
                      <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Montant TTC</th>
                      <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Échéance</th>
                      <th className="px-4 py-3 w-8"/>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {parsed.map((row, i) => (
                      <tr key={i} className={!row._selected ? 'opacity-40' : ''}>
                        <td className="px-4 py-3"><input type="checkbox" checked={row._selected} onChange={e => setParsed(prev => prev.map((r, j) => j === i ? { ...r, _selected: e.target.checked } : r))} className="accent-blue-600" /></td>
                        <td className="px-4 py-3 font-medium text-gray-900">{row.societe || <span className="text-red-500">⚠ manquant</span>}</td>
                        <td className="px-4 py-3 text-gray-500">{row.numero}</td>
                        <td className="px-4 py-3 font-mono text-gray-900">{formatMontant(row.montant_ttc)}</td>
                        <td className="px-4 py-3 text-gray-500">{row.date_echeance}</td>
                        <td className="px-4 py-3"><button onClick={() => setParsed(prev => prev.filter((_, j) => j !== i))} className="text-xs text-red-400 hover:text-red-600">✕</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </main>
  )
}

function UploadZone({ accept, label, sub, onChange, loading }: { accept: string; label: string; sub: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; loading?: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  return (
    <div onClick={() => inputRef.current?.click()} onDragOver={e => { e.preventDefault(); setDragOver(true) }} onDragLeave={() => setDragOver(false)}
      onDrop={e => { e.preventDefault(); setDragOver(false); const file = e.dataTransfer.files[0]; if (file && inputRef.current) { const dt = new DataTransfer(); dt.items.add(file); inputRef.current.files = dt.files; onChange({ target: inputRef.current } as any) } }}
      className={`border-2 border-dashed rounded-2xl p-16 text-center cursor-pointer transition-all ${dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'}`}>
      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={onChange} />
      <div className="text-4xl mb-4">{loading ? '⏳' : '📂'}</div>
      <div className="font-medium text-gray-700">{loading ? 'Extraction en cours…' : label}</div>
      <div className="text-sm text-gray-400 mt-1">{sub}</div>
    </div>
  )
}
ENDOFFILE
echo "✅ ImportClient.tsx"

echo ""
echo "✅ Corrections appliquées — textes lisibles + qualifier en clair !"
