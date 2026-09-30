import { cn } from '../../utils/cn'

export function Input({ label, className, ...props }) {
  return (
    <div className="w-full">
      {label && <label className="text-sm text-[#707070] block mb-1">{label}</label>}
      <input
        className={cn(
          'w-full h-11 px-4 rounded-xl border border-[#E8E8E5] bg-white text-[#181818]',
          'focus:outline-none focus:ring-2 focus:ring-[#181818]/10 focus:border-[#181818]',
          'placeholder:text-[#A0A0A0] tabular-nums',
          className
        )}
        {...props}
      />
    </div>
  )
}
