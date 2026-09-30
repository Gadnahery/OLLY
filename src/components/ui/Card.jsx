import { cn } from '../../utils/cn'

export function Card({ children, className, padding = true }) {
  return (
    <div className={cn('bg-white border border-[#E8E8E5] rounded-2xl', padding && 'p-5', className)}>
      {children}
    </div>
  )
}

export function KPICard({ label, value, change, changeLabel }) {
  const isUp = change > 0
  return (
    <Card>
      <p className="text-sm text-[#707070] mb-1">{label}</p>
      <p className="text-2xl font-semibold tabular-nums tracking-tight">{value}</p>
      {change != null && (
        <p className={cn('text-xs mt-2', isUp ? 'text-[#3F8065]' : 'text-[#B4534A]')}>
          {isUp ? '↑' : '↓'} {Math.abs(change)}% {changeLabel || 'vs previous'}
        </p>
      )}
    </Card>
  )
}
