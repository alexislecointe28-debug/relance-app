'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) setError(error.message)
    else setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 w-full max-w-sm">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900 mb-1">Mot de passe oubli&eacute;</h1>
          <p className="text-sm text-gray-400">On t&apos;envoie un lien. Promis c&apos;est rapide.</p>
        </div>
        {sent ? (
          <div className="space-y-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-700">
              Email envoy&eacute; &agrave; <strong>{email}</strong>. V&eacute;rifie ta bo&icirc;te &mdash; et tes spams.
            </div>
            <Link href="/login" className="block text-center text-sm text-indigo-600 hover:underline">
              Retour &agrave; la connexion
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                placeholder="ton@email.com"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
            </div>
            {error && <div className="text-xs text-red-500">{error}</div>}
            <button type="submit" disabled={loading}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors">
              {loading ? '...' : 'Envoyer le lien'}
            </button>
            <Link href="/login" className="block text-center text-sm text-gray-400 hover:text-gray-600">
              Retour &agrave; la connexion
            </Link>
          </form>
        )}
      </div>
    </div>
  )
}
