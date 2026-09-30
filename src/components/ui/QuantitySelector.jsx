import { Minus, Plus } from 'lucide-react'

export function QuantitySelector({ value, onChange, min = 0, max = 99999, step = 1 }) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - step))}
        className="w-9 h-9 rounded-lg border border-[#E8E8E5] flex items-center justify-center hover:bg-[#F7F7F5]"
        disabled={value <= min}
      >
        <Minus className="w-4 h-4" />
      </button>
      <span className="w-10 text-center font-medium tabular-nums text-lg">{value}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + step))}
        className="w-9 h-9 rounded-lg border border-[#E8E8E5] flex items-center justify-center hover:bg-[#F7F7F5]"
        disabled={value >= max}
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  )
}
