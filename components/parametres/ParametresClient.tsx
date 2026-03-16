'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'

interface Membre {
  id: string
  email: string
  prenom?: string
  nom?: string
  role: string
}

interface Org {
  id: string
  nom: string
  stripe_account_id?: string | null
  email_templates?: {
    cordial?: string
    ferme?: string
    mise_en_demeure?: string
  }
}

export default function ParametresClient({ membre, org }: { membre: Membre, org: Org }) {
  const supabase = createClient()

  const DEFAULT_TEMPLATES = {
    cordial: `Madame, Monsieur,

Sauf erreur de notre part, nous constatons qu'une facture d'un montant de {montant} € reste à ce jour impayée.

Nous vous serions reconnaissants de bien vouloir procéder au règlement de cette somme dans les meilleurs délais.

Si ce règlement a déjà été effectué, veuillez ne pas tenir compte de ce message.`,
    ferme: `Madame, Monsieur,

Malgré notre précédent rappel, nous constatons que la somme de {montant} € n'a toujours pas été réglée.

Nous vous demandons de procéder au paiement dans un délai de 8 jours à compter de la réception de ce message.

À défaut, nous nous verrons contraints d'engager les procédures de recouvrement à notre disposition.`,
    mise_en_demeure: `Madame, Monsieur,

En l'absence de règlement de votre part, et après plusieurs relances restées sans suite, nous vous adressons la présente mise en demeure de régler la somme de {montant} € dans un délai de 48 heures.

Passé ce délai, nous engagerons sans préavis supplémentaire une procédure judiciaire de recouvrement, dont les frais vous seront intégralement imputés.`,
  }

  const [templates, setTemplates] = useState({
    cordial: org?.email_templates?.cordial || '',
    ferme: org?.email_templates?.ferme || '',
    mise_en_demeure: org?.email_templates?.mise_en_demeure || '',
  })
  const [templatesSaved, setTemplatesSaved] = useState(false)
  const [templatesLoading, setTemplatesLoading] = useState(false)
  const [activeTemplate, setActiveTemplate] = useState<'cordial' | 'ferme' | 'mise_en_demeure'>('cordial')

  const [prenom, setPrenom] = useState(membre?.prenom || '')
  const [nom, setNom] = useState(membre?.nom || '')
  const [profileSaved, setProfileSaved] = useState(false)
  const [profileLoading, setProfileLoading] = useState(false)

  const [currentPwd, setCurrentPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [pwdError, setPwdError] = useState('')
  const [pwdSaved, setPwdSaved] = useState(false)
  const [pwdLoading, setPwdLoading] = useState(false)

  async function handleProfile(e: React.FormEvent) {
    e.preventDefault()
    setProfileLoading(true)
    setProfileSaved(false)
    await supabase.from('membres').update({ prenom, nom }).eq('id', membre.id)
    setProfileSaved(true)
    setProfileLoading(false)
  }

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault()
    setPwdError('')
    setPwdSaved(false)
    if (newPwd !== confirmPwd) { setPwdError('Les mots de passe ne correspondent pas.'); return }
    if (newPwd.length < 8) { setPwdError('8 caractères minimum.'); return }
    setPwdLoading(true)
    const { error } = await supabase.auth.updateUser({ password: newPwd })
    if (error) setPwdError(error.message)
    else {
      setPwdSaved(true)
      setCurrentPwd('')
      setNewPwd('')
      setConfirmPwd('')
    }
    setPwdLoading(false)
  }

  async function saveTemplates() {
    setTemplatesLoading(true)
    setTemplatesSaved(false)
    // Sauvegarder seulement les templates non vides, sinon null (= utiliser défaut)
    const toSave = {
      cordial: templates.cordial.trim() || null,
      ferme: templates.ferme.trim() || null,
      mise_en_demeure: templates.mise_en_demeure.trim() || null,
    }
    await fetch('/api/parametres', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email_templates: toSave }),
    })
    setTemplatesSaved(true)
    setTemplatesLoading(false)
    setTimeout(() => setTemplatesSaved(false), 3000)
  }

  return (
    <main className="max-w-xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Paramètres</h1>
        <p className="text-sm text-gray-400">{org?.nom} · {membre?.role}</p>
      </div>

      {/* Profil */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Mon profil</h2>
        <form onSubmit={handleProfile} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider font-medium">Prénom</label>
              <input value={prenom} onChange={e => setPrenom(e.target.value)}
                placeholder="Alexis"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider font-medium">Nom</label>
              <input value={nom} onChange={e => setNom(e.target.value)}
                placeholder="Lecointe"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider font-medium">Email</label>
            <input value={membre?.email || ''} disabled
              className="w-full border border-gray-100 rounded-xl px-3 py-2 text-sm bg-gray-50 text-gray-400 cursor-not-allowed" />
          </div>
          <div className="flex items-center gap-3">
            <button type="submit" disabled={profileLoading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors">
              {profileLoading ? '...' : 'Enregistrer'}
            </button>
            {profileSaved && <span className="text-sm text-emerald-600">Profil mis à jour</span>}
          </div>
        </form>
      </div>

      {/* Mot de passe */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Changer le mot de passe</h2>
        <form onSubmit={handlePassword} className="space-y-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider font-medium">Nouveau mot de passe</label>
            <input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} required
              placeholder="8 caractères minimum"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider font-medium">Confirmer</label>
            <input type="password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} required
              placeholder="Même chose"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
          </div>
          {pwdError && <p className="text-xs text-red-500">{pwdError}</p>}
          <div className="flex items-center gap-3">
            <button type="submit" disabled={pwdLoading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors">
              {pwdLoading ? '...' : 'Modifier'}
            </button>
            {pwdSaved && <span className="text-sm text-emerald-600">Mot de passe modifié</span>}
          </div>
        </form>
      </div>

      {/* Stripe Connect */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-3">
        <h2 className="font-semibold text-gray-900">Paiement en ligne</h2>
        <p className="text-xs text-gray-400">Connecte ton compte Stripe pour envoyer des liens de paiement à tes clients. Les règlements vont directement sur ton compte.</p>
        {org?.stripe_account_id ? (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5">
              <span className="text-emerald-500 font-bold">✓</span>
              <span className="text-sm font-medium text-emerald-700">Stripe connecté</span>
              <span className="text-xs text-emerald-500 font-mono">{org.stripe_account_id.slice(0, 16)}...</span>
            </div>
            <a href="/api/stripe/connect" className="text-xs text-gray-400 hover:text-gray-600 underline">Reconnecter</a>
          </div>
        ) : (
          <a href="/api/stripe/connect"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm">
            💳 Connecter mon compte Stripe
          </a>
        )}
      </div>

      {/* Templates emails */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div>
          <h2 className="font-semibold text-gray-900">Templates emails</h2>
          <p className="text-xs text-gray-400 mt-0.5">Variables : <code className="bg-gray-100 px-1 rounded">{'{societe}'}</code> <code className="bg-gray-100 px-1 rounded">{'{montant}'}</code> — La signature est ajoutée automatiquement.</p>
        </div>

        {/* Onglets */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {([['cordial', '😊 Cordial'], ['ferme', '✋ Ferme'], ['mise_en_demeure', '⚖️ Mise en demeure']] as const).map(([key, label]) => (
            <button key={key} onClick={() => setActiveTemplate(key)}
              className={`flex-1 text-xs font-medium py-1.5 rounded-lg transition-colors ${activeTemplate === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {label}
            </button>
          ))}
        </div>

        {/* Éditeur */}
        <div className="space-y-2">
          <textarea
            value={templates[activeTemplate]}
            onChange={e => setTemplates(prev => ({ ...prev, [activeTemplate]: e.target.value }))}
            rows={8}
            placeholder={DEFAULT_TEMPLATES[activeTemplate]}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none font-mono"
          />
          <div className="flex items-center justify-between">
            <button
              onClick={() => setTemplates(prev => ({ ...prev, [activeTemplate]: '' }))}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              ↩ Restaurer le défaut
            </button>
            <div className="flex items-center gap-3">
              {templatesSaved && <span className="text-xs text-emerald-600 font-medium">✓ Sauvegardé</span>}
              <button onClick={saveTemplates} disabled={templatesLoading}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50">
                {templatesLoading ? '...' : 'Sauvegarder'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Support & feedback */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-3">
        <h2 className="font-semibold text-gray-900">Support & feedback</h2>
        <div className="flex flex-col sm:flex-row gap-2">
          <a href="/feedback"
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-xl text-sm font-medium hover:bg-indigo-100 transition-colors">
            💡 Suggérer une amélioration
          </a>
          <a href="mailto:contact@paynelope.com"
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
            ✉️ contact@paynelope.com
          </a>
        </div>
      </div>
    </main>
  )
}
