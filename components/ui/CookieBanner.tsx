'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

declare global {
  interface Window {
    gtag?: (...args: any[]) => void
    dataLayer?: any[]
  }
}

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent')
    if (!consent) setVisible(true)
    else if (consent === 'accepted') enableGA()
  }, [])

  function enableGA() {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('consent', 'update', {
        analytics_storage: 'granted',
      })
    }
  }

  function disableGA() {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('consent', 'update', {
        analytics_storage: 'denied',
      })
    }
  }

  function accept() {
    localStorage.setItem('cookie_consent', 'accepted')
    enableGA()
    setVisible(false)
  }

  function decline() {
    localStorage.setItem('cookie_consent', 'declined')
    disableGA()
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-24 sm:bottom-0 left-0 right-0 z-[90] bg-white border-t border-gray-200 shadow-lg px-4 py-4">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <p className="text-xs text-gray-600 leading-relaxed flex-1">
          Nous utilisons des cookies de mesure d'audience (Google Analytics) pour améliorer Paynelope.
          Aucune donnée n'est revendue à des tiers.{' '}
          <Link href="/legal#cookies" className="text-indigo-600 hover:underline">
            En savoir plus
          </Link>
        </p>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={decline}
            className="px-4 py-2 text-xs font-medium text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Refuser
          </button>
          <button
            onClick={accept}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors"
          >
            Accepter
          </button>
        </div>
      </div>
    </div>
  )
}
