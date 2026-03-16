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
    assignee?: { id: string; prenom?: string; nom?: string; email: string } | null
  }
  membres?: { id: string; prenom?: string; nom?: string; email: string }[]
  isAdmin?: boolean
  plan?: string
  stripeConnected?: boolean
}

type Modal = 'appel' | 'email' | 'contact' | 'paiement' | null
export default function DossierClient({ dossier: initial, membres = [], isAdmin = false, plan = 'demo', stripeConnected = false }: Props) {
  const [dossier, setDossier] = useState(initial)
  const [modal, setModal] = useState<Modal>(null)
  const [pendingStatut, setPendingStatut] = useState<StatutDossier | null>(null)
  const [savingStatut, setSavingStatut] = useState(false)
  const [savingAssignee, setSavingAssignee] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  function loadConfetti(cb: () => void) {
    if (typeof confetti !== 'undefined') { cb(); return }
    const s = document.createElement('script')
    s.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js'
    s.onload = cb
    document.head.appendChild(s)
  }

  async function confirmStatut() {
    if (!pendingStatut) return
    setSavingStatut(true)
    const statut = pendingStatut
    await supabase.from('dossiers').update({ statut }).eq('id', dossier.id)
    setDossier(prev => ({ ...prev, statut }))
    const labels: Record<string, string> = { resolu: 'Dossier résolu', promesse: 'Promesse de paiement', en_attente: 'En attente', a_relancer: 'À relancer' }
    const { data: membre } = await supabase.from('membres').select('id').single()
    await supabase.from('actions').insert({ dossier_id: dossier.id, type: 'note', notes: 'Statut mis à jour : ' + labels[statut], membre_id: membre?.id })
    setPendingStatut(null)
    setSavingStatut(false)
    if (statut === 'resolu') {
      loadConfetti(() => confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ['#6366F1', '#10B981', '#F59E0B'] }))
    }
    router.refresh()
  }

  async function updateAssignee(memberId: string | null) {
    setSavingAssignee(true)
    await supabase.from('dossiers').update({ assigned_to: memberId }).eq('id', dossier.id)
    const assigneeMembre = memberId ? membres.find(m => m.id === memberId) || null : null
    setDossier(prev => ({ ...prev, assigned_to: memberId, assignee: assigneeMembre }))
    setSavingAssignee(false)
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
          <div className="flex items-center gap-2">
          <select
            value={pendingStatut ?? dossier.statut}
            onChange={e => setPendingStatut(e.target.value as StatutDossier)}
            className="border rounded-lg px-3 py-1.5 text-xs font-medium bg-white text-gray-700 border-gray-200 focus:outline-none focus:border-blue-400 cursor-pointer"
          >
            <option value="a_relancer">À relancer</option>
            <option value="en_attente">En attente</option>
            <option value="promesse">Promesse</option>
            <option value="resolu">Résolu</option>
          </select>
          {pendingStatut && pendingStatut !== dossier.statut && (
            <button onClick={confirmStatut} disabled={savingStatut}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap">
              {savingStatut ? '...' : '✓ Valider'}
            </button>
          )}
          </div>
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
        <button onClick={() => setModal('paiement')} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium">
          <span>💳</span> Demander le paiement
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
        <div className="order-1 lg:order-2 space-y-4">
          {/* Assignation — plan Agence, admin seulement */}
          {plan === 'agence' && (
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-sm text-gray-900">Assigné à</h2>
                {savingAssignee && <span className="text-xs text-gray-400">Enregistrement...</span>}
              </div>
              {isAdmin ? (
                <select
                  value={dossier.assigned_to || ''}
                  onChange={e => updateAssignee(e.target.value || null)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                >
                  <option value="">— Non assigné —</option>
                  {membres.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.prenom && m.nom ? `${m.prenom} ${m.nom}` : m.email}
                    </option>
                  ))}
                </select>
              ) : dossier.assignee ? (
                <div className="flex items-center gap-3 bg-indigo-50 rounded-xl px-3 py-2">
                  <div className="w-7 h-7 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-xs">
                    {(dossier.assignee.prenom?.[0] || dossier.assignee.email[0]).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {dossier.assignee.prenom && dossier.assignee.nom
                      ? `${dossier.assignee.prenom} ${dossier.assignee.nom}`
                      : dossier.assignee.email}
                  </span>
                </div>
              ) : (
                <div className="text-sm text-gray-400 italic">Non assigné</div>
              )}
            </div>
          )}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 lg:sticky lg:top-20 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-sm text-gray-900">Contact comptabilité</h2>
              <button onClick={() => setModal('contact')} className="text-xs text-indigo-600 hover:text-blue-700">
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
                  <a href={`mailto:${dossier.contact.email}`} className="flex items-center gap-2 text-sm text-indigo-600 hover:text-blue-700">
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
      {modal === 'email' && <ModalEmail dossierId={dossier.id} contactEmail={dossier.contact?.email || ''} montantTotal={dossier.montant_total} onClose={() => setModal(null)} onSaved={onActionAdded} />}
      {modal === 'contact' && <ModalContact dossierId={dossier.id} contact={dossier.contact} onClose={() => setModal(null)} onSaved={onContactSaved} />}
      {modal === 'paiement' && (
        <ModalPaiement
          dossierId={dossier.id}
          societe={dossier.societe}
          factures={dossier.factures}
          contactEmail={dossier.contact?.email || ''}
          stripeConnected={stripeConnected}
          onClose={() => setModal(null)}
          onSaved={() => onActionAdded({} as Action)}
        />
      )}
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
            {action.type === 'email' && action.email_status && (() => {
              const badges: Record<string, { icon: string, color: string, label: string }> = {
                sent:       { icon: '⏳', color: 'text-gray-400', label: 'Envoyé' },
                delivered:  { icon: '✉️', color: 'text-blue-500', label: 'Reçu' },
                opened:     { icon: '👁️', color: 'text-indigo-600', label: 'Ouvert' },
                clicked:    { icon: '🖱️', color: 'text-emerald-600', label: 'Cliqué' },
                bounced:    { icon: '❌', color: 'text-red-500', label: 'Bounced' },
                complained: { icon: '🚫', color: 'text-orange-500', label: 'Spam' },
              }
              const b = badges[action.email_status]
              return b ? (
                <span className={`ml-2 text-xs font-medium ${b.color}`}>{b.icon} {b.label}</span>
              ) : null
            })()}
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs text-gray-400">{formatDate(action.created_at)}</span>
                {action.membre && (
                  <span className="text-xs font-medium text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded-md">
                    {action.membre.prenom}
                  </span>
                )}
              </div>
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
    const { data } = await supabase.from('actions').insert({ dossier_id: dossierId, type: 'appel', resultat, notes, rappel_le: rappelLe || null, membre_id: membre?.id }).select('*, membre:membres(prenom, nom)').single()
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
          <button onClick={handleSave} disabled={loading} className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium disabled:opacity-50">
            {loading ? '…' : 'Noté →'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

function ModalEmail({ dossierId, contactEmail, montantTotal, onClose, onSaved }: { dossierId: string; contactEmail: string; montantTotal: number; onClose: () => void; onSaved: (a: Action) => void }) {
  const supabase = createClient()
  const [niveau, setNiveau] = useState<NiveauEmail>('cordial')
  const [emailDest, setEmailDest] = useState(contactEmail)
  const [notes, setNotes] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [sendError, setSendError] = useState('')
  const [step, setStep] = useState<'compose' | 'preview'>('compose')
  const [emailBody, setEmailBody] = useState('')

  const TEXTES: Record<NiveauEmail, string> = {
    cordial: `Madame, Monsieur,

Sauf erreur de notre part, nous constatons qu'une facture d'un montant de ${String(montantTotal.toFixed(2))} € reste à ce jour impayée.

Nous vous serions reconnaissants de bien vouloir procéder au règlement de cette somme dans les meilleurs délais.

Si ce règlement a déjà été effectué, veuillez ne pas tenir compte de ce message.

Cordialement,`,
    ferme: `Madame, Monsieur,

Malgré notre précédent rappel, nous constatons que la somme de ${String(montantTotal.toFixed(2))} € n'a toujours pas été réglée.

Nous vous mettons en demeure de procéder au paiement de cette somme dans un délai de 8 jours à compter de la réception du présent courrier.

À défaut, nous nous verrons contraints d'engager les procédures de recouvrement à notre disposition.

Cordialement,`,
    mise_en_demeure: `Madame, Monsieur,

En l'absence de règlement de votre part, et après plusieurs relances restées sans suite, nous vous adressons la présente mise en demeure de régler la somme de ${String(montantTotal.toFixed(2))} € dans un délai de 48 heures.

Passé ce délai, nous engagerons sans préavis supplémentaire une procédure judiciaire de recouvrement, dont les frais vous seront intégralement imputés.`,
  }

  function handlePreview() {
    setEmailBody(TEXTES[niveau])
    setStep('preview')
  }

  async function handleSend() {
    setSending(true)
    setSendError('')
    const res = await fetch('/api/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dossier_id: dossierId, niveau, email_destinataire: emailDest, notes, body_override: emailBody }),
    })
    if (!res.ok) {
      const err = await res.json()
      setSendError(err.error || "Erreur lors de l'envoi")
      setSending(false)
      return
    }
    const membreRes = await supabase.from('membres').select('id').single()
    const { data: actionData } = await supabase.from('actions').insert({
      dossier_id: dossierId, type: 'email', niveau_email: niveau,
      notes: (notes || '') + (emailDest ? ' — envoyé à ' + emailDest : ''),
      membre_id: membreRes.data?.id
    }).select('*, membre:membres(prenom, nom)').single()
    setSending(false)
    setSent(true)
    if (actionData) onSaved(actionData as Action)
    setTimeout(() => onClose(), 1200)
  }

  return (
    <Modal title="✉️ Un mail bien placé, ça peut suffire." onClose={onClose}>
      {step === 'compose' ? (
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider">Envoyer à</label>
            <input type="email" value={emailDest} onChange={e => setEmailDest(e.target.value)}
              placeholder="client@entreprise.fr"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
            {!emailDest && <p className="text-xs text-amber-500 mt-1">Aucun email — remplis le champ ou ajoute un contact.</p>}
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wider">Niveau</label>
            <div className="flex gap-2">
              {(['cordial', 'ferme', 'mise_en_demeure'] as NiveauEmail[]).map(n => (
                <button key={n} type="button" onClick={() => setNiveau(n)}
                  className={"flex-1 py-2 rounded-xl border text-xs font-medium transition-all " + (niveau === n ? 'bg-indigo-50 border-indigo-300 text-indigo-600' : 'border-gray-200 text-gray-500')}>
                  {n === 'cordial' ? 'Cordial' : n === 'ferme' ? 'Ferme' : 'Mise en demeure'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider">Notes internes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              placeholder="Le contexte, pour s'en souvenir dans 3 semaines."
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none" />
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
              Annuler
            </button>
            <button type="button" onClick={handlePreview} disabled={!emailDest}
              className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50">
              Voir le mail →
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 rounded-xl px-3 py-2">
            <span>À :</span>
            <span className="font-medium text-gray-700">{emailDest}</span>
            <button onClick={() => setStep('compose')} className="ml-auto text-indigo-600 hover:underline text-xs">Modifier</button>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider">Contenu — éditable</label>
            <textarea value={emailBody} onChange={e => setEmailBody(e.target.value)} rows={11}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none leading-relaxed" />
          </div>
          {sendError && <p className="text-xs text-red-500">{sendError}</p>}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={() => setStep('compose')}
              className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
              Retour
            </button>
            <button type="button" onClick={handleSend} disabled={sending || sent}
              className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50">
              {sending ? 'Envoi...' : sent ? 'Envoyé ✓' : 'Envoyer →'}
            </button>
          </div>
        </div>
      )}
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
          <button onClick={handleSave} disabled={loading} className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium disabled:opacity-50">
            {loading ? '…' : 'Noté →'}
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop bg-black/30 animate-fade-in overflow-y-auto">
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

// ---- Modal Paiement ----
function ModalPaiement({ dossierId, societe, factures, contactEmail, stripeConnected, onClose, onSaved }: {
  dossierId: string
  societe: string
  factures: Facture[]
  contactEmail: string
  stripeConnected: boolean
  onClose: () => void
  onSaved: () => void
}) {
  const [selectedFactures, setSelectedFactures] = useState<string[]>([])
  const [montantCustom, setMontantCustom] = useState('')
  const [loading, setLoading] = useState(false)
  const [lien, setLien] = useState('')
  const [copied, setCopied] = useState(false)
  const [sendEmail, setSendEmail] = useState(false)
  const [emailDest, setEmailDest] = useState(contactEmail)

  const montantSelectionne = factures
    .filter(f => selectedFactures.includes(f.id) && f.statut !== 'payee')
    .reduce((sum, f) => sum + f.montant_ttc, 0)

  const montantFinal = montantCustom ? parseFloat(montantCustom) : montantSelectionne

  function toggleFacture(id: string) {
    setSelectedFactures(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
    setMontantCustom('')
  }

  async function handleGenerate() {
    if (!montantFinal || montantFinal <= 0) return
    setLoading(true)
    const res = await fetch('/api/stripe/payment-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dossier_id: dossierId,
        facture_ids: selectedFactures,
        montant_custom: montantCustom ? parseFloat(montantCustom) : null,
        description: `Règlement — ${societe}`,
        send_email: sendEmail,
        email_destinataire: emailDest,
      }),
    })
    const data = await res.json()
    setLoading(false)
    if (data.url) {
      setLien(data.url)
      onSaved()
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(lien)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const unpaidFactures = factures.filter(f => f.statut !== 'payee')

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl p-5 space-y-4 my-auto">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-gray-900">💳 Demander le paiement</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>

        {!stripeConnected ? (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center space-y-2">
            <p className="text-sm text-amber-700 font-medium">Compte Stripe non connecté</p>
            <p className="text-xs text-amber-600">Connecte ton compte Stripe dans les paramètres pour envoyer des liens de paiement.</p>
            <a href="/parametres" className="inline-block mt-2 px-4 py-2 bg-amber-600 text-white rounded-xl text-sm font-semibold hover:bg-amber-700">
              Aller aux paramètres →
            </a>
          </div>
        ) : lien ? (
          <div className="space-y-3">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
              <p className="text-xs font-semibold text-emerald-700 mb-1">✓ Lien généré — {montantFinal.toFixed(2)} €</p>
              <p className="text-xs text-emerald-600 font-mono break-all">{lien}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={handleCopy} className="py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold">
                {copied ? '✓ Copié !' : '📋 Copier'}
              </button>
              <a href={`mailto:${emailDest}?subject=Lien de paiement — ${societe}&body=Bonjour,%0A%0AVeuillez trouver ci-dessous votre lien de paiement sécurisé :%0A%0A${lien}%0A%0ACordialement`}
                className="py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-sm font-semibold text-center">
                ✉️ Envoyer par email
              </a>
            </div>
            <button onClick={onClose} className="w-full py-2 text-xs text-gray-400 hover:text-gray-600">Fermer</button>
          </div>
        ) : (
          <>
            {/* Sélection factures */}
            {unpaidFactures.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Factures à régler</p>
                {unpaidFactures.map(f => (
                  <button key={f.id} onClick={() => toggleFacture(f.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border text-sm transition-all ${selectedFactures.includes(f.id) ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <span className="font-medium text-gray-700">{f.numero || 'Sans numéro'}</span>
                    <span className="font-bold text-gray-900">{f.montant_ttc.toFixed(2)} €</span>
                  </button>
                ))}
              </div>
            )}

            {/* Montant calculé */}
            {montantSelectionne > 0 && (
              <div className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2">
                <span className="text-sm text-gray-500">Montant sélectionné</span>
                <span className="font-bold text-gray-900">{montantSelectionne.toFixed(2)} €</span>
              </div>
            )}

            {/* Montant personnalisé */}
            <div>
              <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider">Montant personnalisé (optionnel)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={montantCustom}
                  onChange={e => setMontantCustom(e.target.value)}
                  placeholder="0.00"
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
                <span className="text-sm text-gray-400 font-medium">€</span>
              </div>
            </div>

            {/* Bouton générer */}
            <button
              onClick={handleGenerate}
              disabled={loading || !montantFinal || montantFinal <= 0}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-sm disabled:opacity-50 transition-colors"
            >
              {loading ? 'Génération...' : `Générer le lien — ${montantFinal > 0 ? montantFinal.toFixed(2) + ' €' : '?'}`}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
