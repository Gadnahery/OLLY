import { createContext, useContext, useState, useCallback } from 'react'
import { cn } from '../../utils/cn'
import { Check, AlertCircle, X } from 'lucide-react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now()
    setToasts((t) => [...t, { id, message, type }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000)
  }, [])

  const remove = (id) => setToasts((t) => t.filter((x) => x.id !== id))

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-20 md:bottom-6 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              'pointer-events-auto flex items-start gap-3 p-4 rounded-2xl shadow-lg border bg-white animate-[slideUp_250ms_ease-out]',
              t.type === 'error' ? 'border-[#B4534A]/30' : 'border-[#E8E8E5]'
            )}
          >
            {t.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-[#B4534A] shrink-0" />
            ) : (
              <Check className="w-5 h-5 text-[#3F8065] shrink-0" />
            )}
            <p className="text-sm flex-1">{t.message}</p>
            <button onClick={() => remove(t.id)} className="text-[#707070] hover:text-[#181818]">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) return { addToast: () => {} }
  return ctx
}
