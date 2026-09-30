/**
 * Web push / PWA notifications.
 * Set VITE_ONESIGNAL_APP_ID in env to enable OneSignal when you have the key.
 * Until then, native Notification API works after user permission.
 */

export async function requestNotificationPermission() {
  if (!('Notification' in window)) return 'unsupported'
  if (Notification.permission === 'granted') return 'granted'
  if (Notification.permission === 'denied') return 'denied'
  return Notification.requestPermission()
}

export async function showLocalNotification(title, body, url = '/') {
  const perm = await requestNotificationPermission()
  if (perm !== 'granted') return false
  if (navigator.serviceWorker?.controller) {
    const reg = await navigator.serviceWorker.ready
    await reg.showNotification(title, { body, icon: '/icon-192.png', data: { url } })
    return true
  }
  new Notification(title, { body, icon: '/icon-192.png' })
  return true
}

/** Optional OneSignal bootstrap when app id is provided */
export function initPushProvider() {
  const appId = import.meta.env.VITE_ONESIGNAL_APP_ID
  if (!appId || typeof window === 'undefined') return
  // Lazy load pattern — owner pastes OneSignal app id in Vercel env
  window.OneSignalDeferred = window.OneSignalDeferred || []
  window.OneSignalDeferred.push(async function (OneSignal) {
    await OneSignal.init({ appId, allowLocalhostAsSecureOrigin: true })
  })
  if (!document.getElementById('onesignal-sdk')) {
    const s = document.createElement('script')
    s.id = 'onesignal-sdk'
    s.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js'
    s.defer = true
    document.head.appendChild(s)
  }
}
