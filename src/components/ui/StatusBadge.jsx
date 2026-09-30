import { cn } from '../../utils/cn'

const styles = {
  paid: 'bg-[#3F8065]/10 text-[#3F8065]',
  completed: 'bg-[#3F8065]/10 text-[#3F8065]',
  partial: 'bg-[#B7833F]/10 text-[#B7833F]',
  pending: 'bg-[#B7833F]/10 text-[#B7833F]',
  in_progress: 'bg-[#B7833F]/10 text-[#B7833F]',
  overdue: 'bg-[#B4534A]/10 text-[#B4534A]',
  draft: 'bg-[#E8E8E5] text-[#707070]',
  confirmed: 'bg-[#181818]/10 text-[#181818]',
  ready: 'bg-[#3F8065]/10 text-[#3F8065]',
  in_production: 'bg-[#B7833F]/10 text-[#B7833F]',

  cancelled: 'bg-[#B4534A]/10 text-[#B4534A]',
}

export function StatusBadge({ status }) {
  const key = (status || '').toLowerCase().replace(' ', '_')
  return (
    <span className={cn('text-xs px-2 py-1 rounded-full capitalize', styles[key] || styles.draft)}>
      {(status || '').replace('_', ' ')}
    </span>
  )
}
