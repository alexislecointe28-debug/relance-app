'use client'

import { useState } from 'react'
import { formatDate } from '@/lib/utils'

interface Membre {
  id: string
  email: string
  prenom?: string
  nom?: string
  role: string
  created_at: string
}

export default function EquipeClient({ membres: initial, orgNom, plan }: { membres: Membre[], orgNom: string, plan: string }) {
  const LIMITES: Record<string, number> = { demo: 1, solo: 3, agence: Infinity }
  const limiteCollabs = LIMITES[plan] ?? 1
  const limiteAtteinte = limiteCollabs !== Infinity && initial.length >= limiteCollabs
  const [membres, setMembres] = useState(initial)
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [credentials, setCredentials] = useState<{ email: string; password: string } | null>(null)

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/equipe/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })

    const data = await res.json()
    if (!res.ok) {
      if (data.error === 'LIMITE_COLLABS') {
        setError(`Limite atteinte — le plan ${plan === 'solo' ? 'Solo' : 'Démo'} est limité à ${data.limite} collaborateur${data.limite > 1 ? 's' : ''}. Passez au plan Agence pour inviter davantage.`)
      } else {
        setError(data.error || "Erreur lors de l'invitation")
      }
    } else {
      setCredentials({ email, password: data.tempPassword })
      setMembres(prev => [...prev, {
        id: Math.random().toString(),
        email,
        role: 'membre',
        created_at: new Date().toISOString(),
      }])
      setEmail('')
      setShowForm(false)
    }
    setLoading(false)
  }

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Équipe</h1>
          <p className="text-gray-500 text-sm">{orgNom} · {membres.length} membre(s)</p>
          {limiteCollabs !== Infinity && (
            <div className="flex items-center gap-1.5 mt-1">
              {[...Array(limiteCollabs)].map((_, i) => (
                <div key={i} className={`h-1.5 w-6 rounded-full ${i < membres.length ? 'bg-indigo-500' : 'bg-gray-200'}`} />
              ))}
              <span className="text-xs text-gray-400 ml-1">{membres.length}/{limiteCollabs} collaborateurs</span>
            </div>
          )}
        </div>
        {limiteAtteinte ? (
          <a href="/pricing"
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold">
            🚀 Passer Agence
          </a>
        ) : (
        <button
          onClick={() => { setShowForm(!showForm); setCredentials(null); setError('') }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          Inviter un collaborateur
        </button>
        )}
      </div>

      {/* Formulaire invitation */}
      {showForm && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-5 mb-6 animate-slide-up">
          <h2 className="font-semibold text-gray-900 mb-1">Inviter par email</h2>
          <p className="text-sm text-gray-500 mb-4">Un compte sera créé. Vous recevrez les identifiants à transmettre au collaborateur.</p>
          <form onSubmit={handleInvite} className="flex gap-3">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="collaborateur@entreprise.fr"
              className="input-base flex-1"
              autoFocus
            />
            <button type="submit" disabled={loading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 flex-shrink-0">
              {loading ? '…' : 'Créer le compte'}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium flex-shrink-0">
              Annuler
            </button>
          </form>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </div>
      )}

      {/* Affichage identifiants */}
      {plan === 'agence' && (
        <a href="/equipe/assignations"
          className="flex items-center justify-between w-full p-4 mb-6 bg-indigo-50 border border-indigo-200 rounded-2xl hover:bg-indigo-100 transition-colors group">
          <div>
            <div className="font-semibold text-indigo-800 text-sm">Gérer les assignations</div>
            <div className="text-xs text-indigo-500 mt-0.5">Attribuer les dossiers à vos collaborateurs</div>
          </div>
          <span className="text-indigo-400 group-hover:translate-x-0.5 transition-transform">→</span>
        </a>
      )}

      {credentials && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 mb-6 animate-slide-up">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-semibold text-emerald-800 mb-1">✅ Compte créé !</h2>
              <p className="text-sm text-emerald-700 mb-4">Transmettez ces identifiants à votre collaborateur.</p>
            </div>
            <button onClick={() => setCredentials(null)} className="text-emerald-400 hover:text-emerald-600 text-lg">✕</button>
          </div>
          <div className="bg-white border border-emerald-200 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">Email</span>
              <span className="text-sm font-medium text-gray-900">{credentials.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">Mot de passe temporaire</span>
              <div className="flex items-center gap-2">
                <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded text-gray-900">{credentials.password}</code>
                <button
                  onClick={() => navigator.clipboard.writeText(credentials.password)}
                  className="text-xs text-indigo-600 hover:text-blue-700"
                >
                  Copier
                </button>
              </div>
            </div>
          </div>
          <p className="text-xs text-emerald-600 mt-3">⚠️ Notez ce mot de passe maintenant, il ne sera plus affiché.</p>
        </div>
      )}

      {/* Table membres */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="px-5 py-4 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Membre</th>
              <th className="px-5 py-4 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Email</th>
              <th className="px-5 py-4 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Rôle</th>
              <th className="px-5 py-4 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Depuis</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {membres.map(membre => (
              <tr key={membre.id} className="hover:bg-gray-50">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-indigo-600 text-sm font-semibold">
                      {(membre.prenom?.[0] || membre.email?.[0] || '?').toUpperCase()}
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      {membre.prenom || membre.nom
                        ? `${membre.prenom || ''} ${membre.nom || ''}`.trim()
                        : <span className="text-gray-400 italic">En attente</span>}
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4 text-sm text-gray-600">{membre.email || '—'}</td>
                <td className="px-5 py-4">
                  <span className={`badge ${membre.role === 'admin' ? 'text-purple-600 bg-purple-50 border-purple-200' : 'text-gray-600 bg-gray-100 border-gray-200'}`}>
                    {membre.role}
                  </span>
                </td>
                <td className="px-5 py-4 text-sm text-gray-500">{formatDate(membre.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  )
}
