'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const PLANS = [
  {
    id: 'demo',
    nom: 'Démo',
    prix: 0,
    description: 'Pour tester sans engagement',
    features: ['3 dossiers max', 'Toutes les fonctionnalités', 'Support email'],
    cta: 'Commencer gratuitement',
    href: '/signup',
    highlight: false,
  },
  {
    id: 'solo',
    nom: 'Solo',
    prix: 49,
    description: 'Pour les TPE qui veulent récupérer leur argent',
    features: ['300 dossiers', 'Emails de relance illimités', '3 collaborateurs max', 'Support prioritaire'],
    cta: 'Choisir Solo',
    highlight: true,
  },
  {
    id: 'agence',
    nom: 'Agence',
    prix: 199,
    description: 'Pour les cabinets et agences de recouvrement',
    features: ['Dossiers illimités', 'Collaborateurs illimités', 'Export PDF', 'Support dédié'],
    cta: 'Choisir Agence',
    highlight: false,
  },
]

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null)
  const router = useRouter()

  async function handleCheckout(planId: string) {
    if (planId === 'demo') { router.push('/signup'); return }
    setLoading(planId)
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: planId }),
    })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    else { alert(data.error || 'Erreur'); setLoading(null) }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-16 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <img src="/logo.png" alt="Paynelope" className="h-12 w-auto mx-auto mb-6" style={{ objectFit: 'contain' }} />
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Simple. Transparent. Efficace.</h1>
          <p className="text-gray-400">Pas de frais cachés. Pas de mauvaises surprises. Juste ton argent qui rentre.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map(plan => (
            <div key={plan.id} className={`bg-white rounded-2xl border-2 p-6 shadow-sm flex flex-col ${plan.highlight ? 'border-indigo-500 shadow-indigo-100 shadow-lg' : 'border-gray-200'}`}>
              {plan.highlight && (
                <div className="text-xs font-bold text-indigo-600 bg-indigo-50 rounded-full px-3 py-1 w-fit mb-4">
                  ⚡ Populaire
                </div>
              )}
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-1">{plan.nom}</h2>
                <div className="flex items-end gap-1 mb-2">
                  <span className="text-4xl font-bold text-gray-900">{plan.prix === 0 ? 'Gratuit' : `${plan.prix}€`}</span>
                  {plan.prix > 0 && <span className="text-gray-400 text-sm mb-1">/mois</span>}
                </div>
                <p className="text-sm text-gray-400">{plan.description}</p>
              </div>
              <ul className="space-y-2 mb-8 flex-1">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="text-emerald-500 font-bold">✓</span> {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleCheckout(plan.id)}
                disabled={loading === plan.id}
                className={`w-full py-3 rounded-xl font-semibold text-sm transition-colors ${
                  plan.highlight
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                } disabled:opacity-50`}
              >
                {loading === plan.id ? 'Redirection...' : plan.cta}
              </button>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-gray-400 mt-8">
          Déjà un compte ? <Link href="/login" className="text-indigo-600 hover:underline">Se connecter</Link>
        </p>
      </div>
    </div>
  )
}
