import { ArrowLeft } from 'lucide-react'
import { Button } from '../ui/Button'

/**
 * Full-height guided flow: header + scroll body + fixed footer (Continue always on screen)
 */
export function FlowShell({ title, stepLabel, onBack, children, footer, footerHint }) {
  return (
    <div className="fixed inset-0 z-30 flex flex-col bg-[#F7F7F5] md:static md:inset-auto md:min-h-full md:relative">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[#E8E8E5] bg-white shrink-0">
        <button type="button" onClick={onBack} className="p-2 -ml-2 rounded-lg hover:bg-[#F7F7F5]">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="min-w-0">
          <h1 className="font-semibold truncate">{title}</h1>
          {stepLabel && <p className="text-xs text-[#707070]">{stepLabel}</p>}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 max-w-lg mx-auto w-full">
        {children}
      </div>
      {footer && (
        <div className="shrink-0 border-t border-[#E8E8E5] bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))] max-w-lg mx-auto w-full">
          {footerHint}
          {footer}
        </div>
      )}
    </div>
  )
}

export function FlowContinue({ onClick, disabled, loading, label = 'Continue', primary = true }) {
  return (
    <Button className="w-full" size="lg" disabled={disabled} loading={loading} onClick={onClick}>
      {label}
    </Button>
  )
}
