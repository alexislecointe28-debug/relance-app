'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function SignupPage() {
  const [form, setForm] = useState({ nom_organisation: '', email: '', password: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleSubmit() {
    setError('')
    if (form.password !== form.confirm) { setError('Les mots de passe ne correspondent pas.'); return }
    if (form.password.length < 8) { setError('Mot de passe trop court (8 caractères min).'); return }
    if (!form.nom_organisation.trim()) { setError("Nom de l'organisation requis."); return }
    setLoading(true)
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: form.email, password: form.password, nom_organisation: form.nom_organisation }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error || "Erreur lors de l'inscription."); setLoading(false); return }
    router.push('/onboarding')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Paynelope" className="h-12 w-auto mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900">Créer votre espace</h1>
          <p className="text-sm text-gray-400 mt-1">Rends l’argent. Dès maintenant.</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider">Nom de votre entreprise</label>
            <input type="text" value={form.nom_organisation} onChange={e => setForm(p => ({ ...p, nom_organisation: e.target.value }))}
              placeholder="Atout Film, Cabinet Martin..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider">Email</label>
            <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              placeholder="vous@entreprise.fr"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider">Mot de passe</label>
            <input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
              placeholder="8 caractères minimum"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider">Confirmer</label>
            <input type="password" value={form.confirm} onChange={e => setForm(p => ({ ...p, confirm: e.target.value }))}
              placeholder="Confirmer le mot de passe"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
          </div>
          {error && <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          <button onClick={handleSubmit} disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm disabled:opacity-50">
            {loading ? 'Création...' : 'Créer mon espace →'}
          </button>
        </div>
        <p className="text-center text-xs text-gray-400 mt-4">
          Déjà un compte ?{' '}
          <Link href="/login" className="text-indigo-600 hover:underline">Se connecter</Link>
        </p>
      </div>
      <p className="text-center text-xs text-gray-300 mt-4">
    <a href="/legal" className="hover:text-gray-500 transition-colors">CGU & Mentions légales</a>
  </p>
</div>
  )
}
