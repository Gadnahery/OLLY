import { cn } from '../../utils/cn'

export function Button({ children, variant = 'primary', size = 'md', className, disabled, loading, ...props }) {
  const base = 'inline-flex items-center justify-center font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
  const variants = {
    primary: 'bg-[#181818] text-white hover:bg-[#333] focus:ring-[#181818]',
    secondary: 'bg-white text-[#181818] border border-[#E8E8E5] hover:bg-[#F7F7F5] focus:ring-[#E8E8E5]',
    ghost: 'bg-transparent text-[#181818] hover:bg-[#F0F0ED] focus:ring-[#E8E8E5]',
    danger: 'bg-[#B4534A] text-white hover:bg-[#9a4540] focus:ring-[#B4534A]',
    success: 'bg-[#3F8065] text-white hover:bg-[#356b54] focus:ring-[#3F8065]',
  }
  const sizes = {
    sm: 'h-9 px-3 text-sm rounded-[10px] gap-1.5',
    md: 'h-11 px-4 text-sm rounded-[12px] gap-2',
    lg: 'h-12 px-6 text-base rounded-[12px] gap-2',
  }
  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          {children}
        </>
      ) : children}
    </button>
  )
}
