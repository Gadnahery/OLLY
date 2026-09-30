import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '../../utils/cn'
import { Modal } from './Modal'
import { Button } from './Button'

function startOfDay(d) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function toISO(d) {
  const x = startOfDay(d)
  const y = x.getFullYear()
  const m = String(x.getMonth() + 1).padStart(2, '0')
  const day = String(x.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function getPeriodRange(period, customFrom, customTo) {
  const today = startOfDay(new Date())
  if (period === 'today') return { from: toISO(today), to: toISO(today) }
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
  return { from: null, to: null }
}

/** Simple month grid calendar for range selection */
function MonthCalendar({ year, month, rangeStart, rangeEnd, onPick, onPrev, onNext }) {
  const first = new Date(year, month, 1)
  const startPad = first.getDay() // 0 Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < startPad; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const monthLabel = first.toLocaleString('en', { month: 'long', year: 'numeric' })
  const todayISO = toISO(new Date())

  function dayISO(d) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  }

  function inRange(iso) {
    if (!rangeStart) return false
    if (!rangeEnd) return iso === rangeStart
    return iso >= rangeStart && iso <= rangeEnd
  }

  function isEdge(iso) {
    return iso === rangeStart || iso === rangeEnd
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <button type="button" onClick={onPrev} className="p-2 rounded-xl hover:bg-[#F7F7F5]">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <p className="font-semibold text-sm">{monthLabel}</p>
        <button type="button" onClick={onNext} className="p-2 rounded-xl hover:bg-[#F7F7F5]">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div key={i} className="text-center text-[11px] text-[#707070] py-1 font-medium">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (d == null) return <div key={`e-${i}`} />
          const iso = dayISO(d)
          const selected = inRange(iso)
          const edge = isEdge(iso)
          const isToday = iso === todayISO
          return (
            <button
              key={iso}
              type="button"
              onClick={() => onPick(iso)}
              className={cn(
                'h-10 rounded-xl text-sm tabular-nums transition-colors',
                edge && 'bg-[#181818] text-white font-semibold',
                selected && !edge && 'bg-[#181818]/10 text-[#181818]',
                !selected && isToday && 'ring-1 ring-[#181818]/30',
                !selected && 'hover:bg-[#F7F7F5]'
              )}
            >
              {d}
            </button>
          )
        })}
      </div>
      <p className="text-xs text-[#707070] mt-3 text-center">
        {!rangeStart && 'Tap a start date'}
        {rangeStart && !rangeEnd && 'Tap an end date'}
        {rangeStart && rangeEnd && `${rangeStart} → ${rangeEnd}`}
      </p>
    </div>
  )
}

/**
 * Today / Yesterday / 7D / 30D / Custom — chips + visual calendar (WiseCash-style)
 */
export function PeriodPicker({ value, onChange, customFrom, customTo, onCustomChange, labels }) {
  const [open, setOpen] = useState(false)
  const [from, setFrom] = useState(customFrom || '')
  const [to, setTo] = useState(customTo || '')
  const [cursor, setCursor] = useState(() => {
    const d = new Date()
    return { year: d.getFullYear(), month: d.getMonth() }
  })

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
      setFrom(customFrom || '')
      setTo(customTo || '')
      setOpen(true)
      return
    }
    onChange(id)
  }

  function onDay(iso) {
    if (!from || (from && to)) {
      setFrom(iso)
      setTo('')
      return
    }
    if (iso < from) {
      setTo(from)
      setFrom(iso)
    } else {
      setTo(iso)
    }
  }

  function applyCustom() {
    if (!from || !to) return
    onCustomChange?.(from, to)
    onChange('custom')
    setOpen(false)
  }

  const customLabel = useMemo(() => {
    if (value === 'custom' && customFrom && customTo) {
      return ` · ${customFrom.slice(5)}→${customTo.slice(5)}`
    }
    return ''
  }, [value, customFrom, customTo])

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
            {o.id === 'custom' ? customLabel : ''}
          </button>
        ))}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Choose dates" size="md">
        <MonthCalendar
          year={cursor.year}
          month={cursor.month}
          rangeStart={from}
          rangeEnd={to}
          onPick={onDay}
          onPrev={() =>
            setCursor((c) => {
              const m = c.month - 1
              return m < 0 ? { year: c.year - 1, month: 11 } : { year: c.year, month: m }
            })
          }
          onNext={() =>
            setCursor((c) => {
              const m = c.month + 1
              return m > 11 ? { year: c.year + 1, month: 0 } : { year: c.year, month: m }
            })
          }
        />
        <div className="flex gap-2 mt-4">
          <Button variant="secondary" className="flex-1" onClick={() => { setFrom(''); setTo('') }}>
            Clear
          </Button>
          <Button className="flex-1" disabled={!from || !to} onClick={applyCustom}>
            Apply
          </Button>
        </div>
      </Modal>
    </>
  )
}
