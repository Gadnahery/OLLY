import { useState } from 'react'
import { cn } from '../../utils/cn'
import { Modal } from './Modal'
import { Button } from './Button'

function startOfDay(d) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

export function getPeriodRange(period, customFrom, customTo) {
  const today = startOfDay(new Date())
  const toISO = (d) => d.toISOString().slice(0, 10)
  if (period === 'today') {
    return { from: toISO(today), to: toISO(today) }
  }
  if (period === 'yesterday') {
    const y = new Date(today)
    y.setDate(y.getDate() - 1)
    return { from: toISO(y), to: toISO(y) }
  }
  if (period === '7d') {
    const f = new Date(today)
    f.setDate(f.getDate() - 6)
    return { from: toISO(f), to: toISO(today) }
  }
  if (period === '30d') {
    const f = new Date(today)
    f.setDate(f.getDate() - 29)
    return { from: toISO(f), to: toISO(today) }
  }
  if (period === 'custom' && customFrom && customTo) {
    return { from: customFrom, to: customTo }
  }
  // all
  return { from: null, to: null }
}

/**
 * Today / Yesterday / 7D / 30D / Custom — horizontal chips + date modal
 */
export function PeriodPicker({ value, onChange, customFrom, customTo, onCustomChange, labels }) {
  const [open, setOpen] = useState(false)
  const [from, setFrom] = useState(customFrom || '')
  const [to, setTo] = useState(customTo || '')

  const opts = labels || [
    { id: 'today', label: 'Today' },
    { id: 'yesterday', label: 'Yesterday' },
    { id: '7d', label: '7 days' },
    { id: '30d', label: '30 days' },
    { id: 'all', label: 'All' },
    { id: 'custom', label: 'Custom' },
  ]

  function pick(id) {
    if (id === 'custom') {
      setOpen(true)
      return
    }
    onChange(id)
  }

  function applyCustom() {
    if (!from || !to) return
    onCustomChange?.(from, to)
    onChange('custom')
    setOpen(false)
  }

  return (
    <>
      <div
        className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none"
        style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}
      >
        {opts.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => pick(o.id)}
            className={cn(
              'px-3.5 py-2 rounded-full text-sm whitespace-nowrap shrink-0 border transition-colors',
              value === o.id
                ? 'bg-[#181818] text-white border-[#181818]'
                : 'bg-white text-[#181818] border-[#E8E8E5]'
            )}
          >
            {o.label}
            {o.id === 'custom' && value === 'custom' && customFrom
              ? ` · ${customFrom.slice(5)}→${customTo?.slice(5)}`
              : ''}
          </button>
        ))}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Custom dates">
        <div className="space-y-3">
          <div>
            <label className="text-sm text-[#707070]">From</label>
            <input type="date" className="mt-1 w-full h-11 px-4 rounded-xl border border-[#E8E8E5]"
              value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <label className="text-sm text-[#707070]">To</label>
            <input type="date" className="mt-1 w-full h-11 px-4 rounded-xl border border-[#E8E8E5]"
              value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <Button className="w-full" disabled={!from || !to} onClick={applyCustom}>
            Apply
          </Button>
        </div>
      </Modal>
    </>
  )
}
