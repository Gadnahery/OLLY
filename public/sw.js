/* OLLY service worker — offline shell + push hook */
const CACHE = 'olly-v1'
const PRECACHE = ['/', '/index.html', '/manifest.json', '/icon-192.png', '/icon-512.png']

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url)
  if (e.request.method !== 'GET') return
  if (url.origin !== self.location.origin) return
  e.respondWith(
    caches.match(e.request).then((cached) => {
      const fetchPromise = fetch(e.request)
        .then((res) => {
          if (res && res.status === 200 && res.type === 'basic') {
            const copy = res.clone()
            caches.open(CACHE).then((c) => c.put(e.request, copy))
          }
          return res
        })
        .catch(() => cached)
      return cached || fetchPromise
    })
  )
})

self.addEventListener('push', (e) => {
  let data = { title: 'OLLY', body: 'You have an update', url: '/' }
  try {
    if (e.data) data = { ...data, ...e.data.json() }
  } catch (_) {
    if (e.data) data.body = e.data.text()
  }
  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: { url: data.url || '/' },
    })
  )
})

self.addEventListener('notificationclick', (e) => {
  e.notification.close()
  const url = e.notification.data?.url || '/'
  e.waitUntil(clients.matchAll({ type: 'window' }).then((list) => {
    for (const c of list) {
      if (c.url.includes(self.location.origin) && 'focus' in c) return c.focus()
    }
    if (clients.openWindow) return clients.openWindow(url)
  }))
})
