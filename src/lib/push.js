/**
 * Web Push with VAPID for Olly PWA.
 * Public key is safe in the client. Private key must stay server-side only.
 */
import { supabase } from './supabase'

const VAPID_PUBLIC_KEY =
  import.meta.env.VITE_VAPID_PUBLIC_KEY ||
  'BKCyIlxwHrtl0pbSmq_VDvGDbVithfcwOMlMd4qedbzWf3DUntTvoXT1eP8T7rSeryMqQGirOw_0E1UL9Pf6Phw'

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const out = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}

export async function requestNotificationPermission() {
  if (!('Notification' in window)) return 'unsupported'
  if (Notification.permission === 'granted') return 'granted'
  if (Notification.permission === 'denied') return 'denied'
  return Notification.requestPermission()
}

export async function showLocalNotification(title, body, url = '/') {
  const perm = await requestNotificationPermission()
  if (perm !== 'granted') return false
  const reg = await navigator.serviceWorker?.ready
  if (reg) {
    await reg.showNotification(title, {
      body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: { url },
    })
    return true
  }
  new Notification(title, { body, icon: '/icon-192.png' })
  return true
}

/** Subscribe this device for push and store endpoint in Supabase */
export async function subscribePush(userId = null) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    throw new Error('Push not supported on this browser')
  }
  const perm = await requestNotificationPermission()
  if (perm !== 'granted') throw new Error('Notification permission not granted')

  const reg = await navigator.serviceWorker.ready
  let sub = await reg.pushManager.getSubscription()
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    })
  }

  const json = sub.toJSON()
  const endpoint = json.endpoint
  const p256dh = json.keys?.p256dh
  const auth = json.keys?.auth
  if (!endpoint || !p256dh || !auth) throw new Error('Invalid push subscription')

  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      user_id: userId,
      endpoint,
      p256dh,
      auth,
      user_agent: navigator.userAgent,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'endpoint' }
  )
  if (error) throw error
  return sub
}

export async function unsubscribePush() {
  const reg = await navigator.serviceWorker?.ready
  const sub = await reg?.pushManager.getSubscription()
  if (sub) {
    const endpoint = sub.endpoint
    await sub.unsubscribe()
    await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint)
  }
}

/** Called on app load — registers SW already; optional auto-prompt later */
export function initPushProvider() {
  // VAPID is used on explicit Enable notifications; nothing to load
}
