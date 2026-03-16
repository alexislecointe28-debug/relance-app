'use client'
import { useEffect, useState } from 'react'

export default function UpdateBanner() {
  const [showBanner, setShowBanner] = useState(false)
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    navigator.serviceWorker.ready.then(reg => {
      setRegistration(reg)

      // Vérifier les mises à jour toutes les 5 min
      const interval = setInterval(() => reg.update(), 5 * 60 * 1000)

      // Détecter un nouveau SW en attente
      const checkUpdate = () => {
        if (reg.waiting) setShowBanner(true)
      }

      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing
        if (!newWorker) return
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            setShowBanner(true)
          }
        })
      })

      checkUpdate()
      return () => clearInterval(interval)
    })

    // Recharger quand le nouveau SW prend le contrôle
    let refreshing = false
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true
        window.location.reload()
      }
    })
  }, [])

  function handleUpdate() {
    if (registration?.waiting) {
      registration.waiting.postMessage('SKIP_WAITING')
    }
    setShowBanner(false)
  }

  if (!showBanner) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-indigo-600 text-white text-sm flex items-center justify-between px-4 py-2.5 shadow-lg animate-slide-down">
      <div className="flex items-center gap-2">
        <span>🔄</span>
        <span className="font-medium">Une mise à jour est disponible</span>
      </div>
      <button
        onClick={handleUpdate}
        className="bg-white text-indigo-600 font-semibold text-xs px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors shrink-0"
      >
        Recharger →
      </button>
    </div>
  )
}
