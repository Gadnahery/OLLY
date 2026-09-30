import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { isOnline, listQueue, startOfflineListeners, flushQueue } from '../../lib/offline'
import { cn } from '../../utils/cn'

export function OfflineBanner() {
  const [online, setOnline] = useState(isOnline())
  const [pending, setPending] = useState(0)
  const [syncing, setSyncing] = useState(false)
  const [message, setMessage] = useState(null)

  async function refreshCount() {
    const q = await listQueue()
    setPending(q.filter((i) => i.status === 'pending').length)
  }

  useEffect(() => {
    refreshCount()
    const onQueue = () => refreshCount()
    window.addEventListener('olly-queue-changed', onQueue)
    window.addEventListener('online', () => setOnline(true))
    window.addEventListener('offline', () => setOnline(false))

    const stop = startOfflineListeners(supabase, (s) => {
      setOnline(!!s.online)
      setSyncing(!!s.syncing)
      if (s.synced > 0) {
        setMessage(`Synced ${s.synced} offline action${s.synced > 1 ? 's' : ''}`)
        setTimeout(() => setMessage(null), 4000)
        refreshCount()
      }
    })
    return () => {
      stop()
      window.removeEventListener('olly-queue-changed', onQueue)
    }
  }, [])

  if (online && pending === 0 && !message) return null

  return (
    <div
      className={cn(
        'px-4 py-2 text-sm text-center z-50',
        !online ? 'bg-[#B7833F] text-white' : message ? 'bg-[#3F8065] text-white' : 'bg-[#181818] text-white'
      )}
    >
      {!online && (
        <span>
          You&apos;re offline — records are saved on this device and will sync when you&apos;re back online.
          {pending > 0 ? ` (${pending} pending)` : ''}
        </span>
      )}
      {online && pending > 0 && !message && (
        <button
          type="button"
          className="underline"
          onClick={async () => {
            setSyncing(true)
            await flushQueue(supabase)
            setSyncing(false)
            refreshCount()
          }}
        >
          {syncing ? 'Syncing…' : `Sync ${pending} offline action${pending > 1 ? 's' : ''} now`}
        </button>
      )}
      {message && <span>{message}</span>}
    </div>
  )
}
