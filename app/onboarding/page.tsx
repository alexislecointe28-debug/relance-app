'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const STEPS = [
  {
    id: 1,
    emoji: '📥',
    title: 'Importe tes factures',
    desc: 'Glisse ton fichier Excel ou CSV. On détecte les colonnes automatiquement.',
    action: 'Importer maintenant',
    href: '/import',
    skip: true,
  },
  {
    id: 2,
    emoji: '🎯',
    title: 'Enrichis tes contacts',
    desc: 'Pour chaque client, ajoute le prénom et l\'email de ta personne chez eux. Sans contact, pas de relance.',
    action: 'Aller au dashboard',
    href: '/dashboard',
    skip: true,
  },
  {
    id: 3,
    emoji: '⚡',
    title: 'Lance ta 1ère relance',
    desc: 'Un appel de 2 minutes peut débloquer des semaines de retard. T\'as le script, t\'as le numéro. Go.',
    action: 'C\'est parti →',
    href: '/dashboard',
    skip: false,
  },
]

export default function OnboardingPage() {
  const [step, setStep] = useState(0)
  const router = useRouter()
  const current = STEPS[step]

  function next() {
    if (step < STEPS.length - 1) setStep(s => s + 1)
    else router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-10">
          <img src="/logo.png" alt="Paynelope" style={{ height: '48px', width: '220px', objectFit: 'contain', margin: '0 auto' }} />
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s.id} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i <= step ? 'bg-indigo-600' : 'bg-gray-200'}`} />
          ))}
        </div>

        {/* Card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm text-center animate-slide-up" key={step}>
          <div className="text-6xl mb-5">{current.emoji}</div>
          <h2 className="text-xl font-bold text-gray-900 mb-3">{current.title}</h2>
          <p className="text-sm text-gray-500 leading-relaxed mb-8">{current.desc}</p>

          <Link href={current.href}
            className="w-full block py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm transition-colors mb-3">
            {current.action}
          </Link>

          {step < STEPS.length - 1 && (
            <button onClick={next} className="w-full py-2.5 text-sm text-gray-400 hover:text-gray-600 transition-colors">
              Passer cette étape →
            </button>
          )}
        </div>

        {/* Step indicator */}
        <p className="text-center text-xs text-gray-300 mt-4">
          Étape {step + 1} sur {STEPS.length}
        </p>

      </div>
    </div>
  )
}
