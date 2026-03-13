'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Dossier, Facture, Action, Contact, StatutDossier, StatutFacture, ResultatAppel, NiveauEmail } from '@/types'
import { formatMontant, formatDate, getStatutDossierLabel, getStatutDossierColor, getStatutFactureLabel, getStatutFactureColor, getResultatLabel, getNiveauEmailLabel, toDateString, addDays } from '@/lib/utils'
import { createClient } from '@/lib/supabase'
declare const confetti: any

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
    if (statut === 'resolu') {
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ['#6366F1', '#10B981', '#F59E0B'] })
    }
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
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link href="/dashboard" className="hover:text-gray-700">Tableau de bord</Link>
        <span>/</span>
        <span className="text-gray-700">{dossier.societe}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
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
        <div className="sm:text-right">
          <div className="text-2xl sm:text-3xl font-bold montant-display text-gray-900">{formatMontant(dossier.montant_total)}</div>
          <div className="text-sm text-gray-400">{dossier.factures?.length || 0} facture(s)</div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 mb-6 sm:mb-8">
        <button onClick={() => setModal('appel')} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium">
          <span>📞</span> Noter un appel
        </button>
        <button onClick={() => setModal('email')} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-sm font-medium">
          <span>✉️</span> Envoyer un mail
        </button>
      </div>

      {/* 2-column layout */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6 order-2 lg:order-1">

          {/* Factures */}
          <section className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-sm text-gray-900">Factures</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {dossier.factures?.map(facture => (
                <div key={facture.id} className="px-4 py-3 flex items-center gap-3 flex-wrap sm:flex-nowrap">
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
        <div className="order-1 lg:order-2">
          <div className="bg-white border border-gray-200 rounded-2xl p-5 lg:sticky lg:top-20 shadow-sm">
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
    <Modal title={'📞 Décroché. Note vite.'} onClose={onClose}>
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
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="input-base resize-none" placeholder="Il a dit quoi ? Promis quoi ? Inventé quoi ?" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1.5 uppercase tracking-wider font-medium">Date de rappel</label>
          <input type="date" value={rappelLe} onChange={e => setRappelLe(e.target.value)} className="input-base" />
        </div>
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 hover:bg-gray-50">Annuler</button>
          <button onClick={handleSave} disabled={loading} className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium disabled:opacity-50">
            {loading ? '…' : 'C'est noté →'}
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
    <Modal title="✉️ Un mail bien placé, ça peut suffire." onClose={onClose}>
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
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="input-base resize-none" placeholder="Le contexte, pour s'en souvenir dans 3 semaines." />
        </div>
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 hover:bg-gray-50">Annuler</button>
          <button onClick={handleSave} disabled={loading} className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium disabled:opacity-50">
            {loading ? '…' : 'C'est noté →'}
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
    <Modal title="👤 Qui tu vas harceler ?" onClose={onClose}>
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
            {loading ? '…' : 'C'est noté →'}
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
