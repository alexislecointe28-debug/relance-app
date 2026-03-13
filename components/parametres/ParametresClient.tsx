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
}

export default function ParametresClient({ membre, org }: { membre: Membre, org: Org }) {
  const supabase = createClient()

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
    </main>
  )
}
