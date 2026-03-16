// Service Worker Paynelope — auto-update
const CACHE_PREFIX = 'paynelope-'
let CACHE_NAME = 'paynelope-init'

// Récupère la version courante depuis version.json
async function getCurrentVersion() {
  try {
    const res = await fetch('/version.json?t=' + Date.now(), { cache: 'no-store' })
    const data = await res.json()
    return data.version
  } catch {
    return null
  }
}

self.addEventListener('install', event => {
  event.waitUntil(
    getCurrentVersion().then(version => {
      CACHE_NAME = CACHE_PREFIX + (version || Date.now())
      return caches.open(CACHE_NAME).then(cache => {
        return cache.addAll(['/', '/manifest.json', '/logo.png']).catch(() => {})
      })
    })
  )
  self.skipWaiting()
})

self.addEventListener('activate', event => {
  event.waitUntil(
    getCurrentVersion().then(version => {
      CACHE_NAME = CACHE_PREFIX + (version || Date.now())
      return caches.keys().then(keys =>
        Promise.all(
          keys
            .filter(k => k.startsWith(CACHE_PREFIX) && k !== CACHE_NAME)
            .map(k => caches.delete(k))
        )
      )
    })
  )
  self.clients.claim()
})

self.addEventListener('fetch', event => {
  if (
    event.request.url.includes('/api/') ||
    event.request.url.includes('supabase.co') ||
    event.request.url.includes('stripe.com') ||
    event.request.url.includes('tawk.to') ||
    event.request.url.includes('version.json') ||
    event.request.method !== 'GET'
  ) {
    return
  }

  // Network-first : toujours essayer le réseau, cache en fallback
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response.ok) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone))
        }
        return response
      })
      .catch(() => caches.match(event.request))
  )
})

// Écoute les messages de mise à jour forcée
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})
