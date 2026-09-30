/* Olly service worker — offline shell + VAPID push */
const CACHE = 'olly-v2'
const PRECACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
]

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url)
  if (e.request.method !== 'GET') return
  if (url.origin !== self.location.origin) return

  // Network-first for API-ish; cache-first for static
  const isStatic =
    url.pathname.match(/\.(js|css|png|svg|jpg|jpeg|webp|woff2|json)$/) ||
    url.pathname === '/' ||
    url.pathname === '/index.html'

  if (isStatic) {
    e.respondWith(
      caches.match(e.request).then((cached) => {
        const fetched = fetch(e.request)
          .then((res) => {
            if (res && res.status === 200) {
              const copy = res.clone()
              caches.open(CACHE).then((c) => c.put(e.request, copy))
            }
            return res
          })
          .catch(() => cached)
        return cached || fetched
      })
    )
  }
})

self.addEventListener('push', (e) => {
  let data = { title: 'Olly', body: 'You have an update', url: '/' }
  try {
    if (e.data) {
      const parsed = e.data.json()
      data = { ...data, ...parsed }
    }
  } catch (_) {
    try {
      if (e.data) data.body = e.data.text()
    } catch (_) {}
  }
  e.waitUntil(
    self.registration.showNotification(data.title || 'Olly', {
      body: data.body || '',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: { url: data.url || '/' },
      vibrate: [100, 50, 100],
    })
  )
})

self.addEventListener('notificationclick', (e) => {
  e.notification.close()
  const url = e.notification.data?.url || '/'
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if (c.url.includes(self.location.origin) && 'focus' in c) {
          c.navigate(url)
          return c.focus()
        }
      }
      if (clients.openWindow) return clients.openWindow(url)
    })
  )
})
