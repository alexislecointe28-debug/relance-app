'use client'

import Link from 'next/link'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Email ou mot de passe incorrect.')
      setLoading(false)
      return
    }
    router.push('/')
    router.refresh()
  }

  return (
    <div className="relative min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img src="/logo.png" alt="Paynelope" style={{ height: '56px', width: '240px', objectFit: 'contain' }} />
          </div>
          <p className="text-sm text-gray-400">Rends l’argent.</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              placeholder="vous@entreprise.fr"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider">Mot de passe</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
              placeholder="••••••••"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
          </div>
          {error && <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm disabled:opacity-50">
            {loading ? 'Connexion...' : 'Se connecter →'}
          </button>
          <div className="text-center pt-1">
            <Link href="/forgot-password" className="text-xs text-gray-400 hover:text-gray-600">
              Mot de passe oublié ?
            </Link>
          </div>
        </form>
        <p className="text-center text-xs text-gray-400 mt-4">
          Pas encore de compte ?{' '}
          <Link href="/signup" className="text-indigo-600 hover:underline font-medium">
            Créer un espace
          </Link>
        </p>
      </div>
      <p className="text-center text-xs text-gray-300 pt-6">
        <a href="/legal" className="hover:text-gray-500 transition-colors">CGU &amp; Mentions légales</a>
      </p>
    </div>
  )
}
