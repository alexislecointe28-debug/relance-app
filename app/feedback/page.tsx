'use client'
import { useState } from 'react'
import Link from 'next/link'

export default function FeedbackPage() {
  const [type, setType] = useState('idee')
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit() {
    if (!message.trim()) return
    setLoading(true)
    setError('')
    const res = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, message, email }),
    })
    setLoading(false)
    if (res.ok) setSent(true)
    else setError('Erreur lors de l\'envoi, réessaie.')
  }

  if (sent) return (
    <main className="max-w-lg mx-auto px-4 py-16 text-center">
      <div className="text-5xl mb-4">🙏</div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">Merci pour ton retour !</h2>
      <p className="text-sm text-gray-400 mb-6">Je le lis personnellement et réponds si besoin.</p>
      <Link href="/dashboard" className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700">
        Retour au dashboard
      </Link>
    </main>
  )

  return (
    <main className="max-w-lg mx-auto px-4 py-10 space-y-6">
      <div>
        <Link href="/dashboard" className="text-xs text-gray-400 hover:text-gray-600">← Retour</Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Ton avis compte</h1>
        <p className="text-sm text-gray-400 mt-1">Bug, idée, question — je lis tout personnellement.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
        {/* Type */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { value: 'bug', label: '🐛 Bug' },
            { value: 'idee', label: '💡 Idée' },
            { value: 'question', label: '❓ Question' },
          ].map(t => (
            <button
              key={t.value}
              onClick={() => setType(t.value)}
              className={`py-2.5 rounded-xl text-sm font-medium border transition-all ${
                type === t.value
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Message */}
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Décris ton problème ou ton idée..."
          rows={5}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
        />

        {/* Email optionnel */}
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Ton email (optionnel, pour qu'on te réponde)"
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />

        {error && <p className="text-xs text-red-500">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={loading || !message.trim()}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm disabled:opacity-50 transition-colors"
        >
          {loading ? 'Envoi...' : 'Envoyer →'}
        </button>
      </div>

      {/* Contact direct */}
      <div className="text-center text-xs text-gray-400">
        Ou écris directement à{' '}
        <a href="mailto:contact@paynelope.com" className="text-indigo-500 hover:underline">
          contact@paynelope.com
        </a>
      </div>
    </main>
  )
}
