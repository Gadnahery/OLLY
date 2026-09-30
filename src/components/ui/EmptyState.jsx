import { Button } from './Button'

export function EmptyState({ title, description, actionLabel, onAction }) {
  return (
    <div className="text-center py-12 px-4">
      <p className="font-medium text-[#181818]">{title}</p>
      {description && <p className="text-sm text-[#707070] mt-1 max-w-sm mx-auto">{description}</p>}
      {actionLabel && onAction && (
        <Button className="mt-5" onClick={onAction}>{actionLabel}</Button>
      )}
    </div>
  )
}
