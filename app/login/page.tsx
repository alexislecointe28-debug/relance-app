'use client'
import Link from 'next/link'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
      else router.push('/dashboard')
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setError(error.message)
      else setSuccess('Compte créé ! Vous pouvez vous connecter.')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 grid-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M3 5h14M3 10h10M3 15h7" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="text-2xl font-bold tracking-tight text-gray-900">Relance</span>
          </div>
          <p className="text-gray-500 text-sm">CRM de recouvrement pour TPE</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm animate-fade-in">
          <h1 className="text-lg font-semibold mb-6 text-gray-900">
            {mode === 'login' ? 'Connexion' : 'Créer un compte'}
          </h1>
          {error && <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">{error}</div>}
          {success && <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-600 text-sm">{success}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1.5 font-medium uppercase tracking-wider">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="input-base" placeholder="votre@email.com" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5 font-medium uppercase tracking-wider">Mot de passe</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="input-base" placeholder="••••••••" />
            </div>
            <button type="submit" disabled={loading} className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm disabled:opacity-50">
              {loading ? 'Chargement…' : mode === 'login' ? 'Se connecter' : 'Créer le compte'}
            </button>
          </form>
          <Link href='/forgot-password' className='block text-center text-xs text-gray-400 hover:text-indigo-600 mt-2'>Mot de passe oublié ?</Link>
          <button onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} className="w-full mt-4 text-sm text-gray-500 hover:text-gray-900 text-center">
            {mode === 'login' ? "Pas de compte ? S'inscrire" : 'Déjà un compte ? Se connecter'}
          </button>
        </div>
      </div>
    </div>
  )
}
