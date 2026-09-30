import { cn } from '../../utils/cn'

/** Horizontal scrollable chip row — keeps long filter sets from overwhelming the screen */
export function FilterChips({ options, value, onChange, className }) {
  return (
    <div className={cn('flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none', className)}
      style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>
      {options.map((opt) => {
        const id = typeof opt === 'string' ? opt : opt.id
        const label = typeof opt === 'string' ? opt : opt.label
        const active = value === id
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={cn(
              'px-4 py-2 rounded-full text-sm whitespace-nowrap shrink-0 transition-colors border',
              active
                ? 'bg-[#181818] text-white border-[#181818]'
                : 'bg-white text-[#181818] border-[#E8E8E5] hover:border-[#C8C8C5]'
            )}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}
