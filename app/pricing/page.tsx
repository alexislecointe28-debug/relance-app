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
    prix: null,
    description: 'Pour les cabinets et agences de recouvrement',
    features: ['Dossiers illimités', 'Collaborateurs illimités', 'Gestion multi-clients', 'Support dédié'],
    cta: 'Nous contacter',
    href: 'mailto:contact@paynelope.com',
    highlight: false,
  },
]

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null)
  const [coupon, setCoupon] = useState('')
  const router = useRouter()

  async function handleCheckout(planId: string) {
    if (planId === 'demo') { router.push('/signup'); return }
    setLoading(planId)
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: planId, coupon }),
    })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    else { alert(data.error || 'Erreur'); setLoading(null) }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-16 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center mb-8">
          <Link href="/dashboard" className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 transition-colors">
            ← Retour au dashboard
          </Link>
        </div>
        <div className="text-center mb-12">
          <img src="/logo.png" alt="Paynelope" className="h-12 w-auto mx-auto mb-6" style={{ objectFit: 'contain' }} />
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Simple. Transparent. Efficace.</h1>
          <p className="text-gray-400">Pas de frais cachés. Pas de mauvaises surprises. Juste ton argent qui rentre.</p>
        </div>

        {/* Code promo */}
        <div className="max-w-sm mx-auto mb-8">
          <div className="flex gap-2">
            <input
              type="text"
              value={coupon}
              onChange={e => setCoupon(e.target.value.toUpperCase())}
              placeholder="Code promo (optionnel)"
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
            {coupon && (
              <button onClick={() => setCoupon('')} className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-400 hover:text-gray-600">✕</button>
            )}
          </div>
          {coupon && <p className="text-xs text-indigo-600 mt-1.5 font-medium">✓ Code "{coupon}" appliqué au paiement</p>}
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
                  <span className="text-4xl font-bold text-gray-900">{plan.prix === null ? 'Sur devis' : plan.prix === 0 ? 'Gratuit' : `${plan.prix}€`}</span>
                  {plan.prix !== null && plan.prix > 0 && <span className="text-gray-400 text-sm mb-1">/mois</span>}
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
              {plan.href ? (
                <a href={plan.href}
                  className="w-full py-3 rounded-xl font-semibold text-sm transition-colors bg-gray-100 hover:bg-gray-200 text-gray-800 flex items-center justify-center">
                  {plan.cta}
                </a>
              ) : (
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
              )}
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
