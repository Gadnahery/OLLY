import { cn } from '../../utils/cn'

export function SelectionCard({ title, subtitle, selected, onClick, children, className }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full text-left p-4 rounded-2xl border-2 transition-all duration-150',
        selected
          ? 'border-[#181818] bg-[#F7F7F5]'
          : 'border-[#E8E8E5] bg-white hover:border-[#C8C8C5]',
        className
      )}
    >
      <div className="font-medium text-[#181818]">{title}</div>
      {subtitle && <div className="text-sm text-[#707070] mt-0.5">{subtitle}</div>}
      {children}
    </button>
  )
}
