import { X } from 'lucide-react'
import { cn } from '../../utils/cn'

export function Modal({ open, onClose, title, children, size = 'md' }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="absolute inset-0 bg-black/30 animate-[fadeIn_200ms_ease-out]" onClick={onClose} />
      <div
        className={cn(
          'relative bg-white w-full rounded-t-3xl md:rounded-2xl shadow-xl animate-[slideUp_250ms_ease-out] max-h-[90vh] overflow-y-auto',
          size === 'sm' && 'md:max-w-sm',
          size === 'md' && 'md:max-w-md',
          size === 'lg' && 'md:max-w-lg'
        )}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E8E8E5]">
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
