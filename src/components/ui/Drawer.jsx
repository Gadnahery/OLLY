import { X } from 'lucide-react'
import { cn } from '../../utils/cn'

export function Drawer({ open, onClose, title, children, wide }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30 animate-[fadeIn_200ms_ease-out]" onClick={onClose} />
      <div
        className={cn(
          'relative h-full bg-white shadow-xl overflow-y-auto animate-[slideInRight_250ms_ease-out]',
          wide ? 'w-full max-w-xl' : 'w-full max-w-md'
        )}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between h-14 px-5 border-b border-[#E8E8E5] bg-white">
          <h2 className="font-semibold">{title}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-[#F7F7F5]">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}
