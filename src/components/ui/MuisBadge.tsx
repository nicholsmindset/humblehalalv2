import { cn } from '@/lib/utils'

interface MuisBadgeProps {
  className?: string
  label?: string
}

export function MuisBadge({ className, label = 'MUIS Certified' }: MuisBadgeProps) {
  return (
    <span
      className={cn(
        'bg-primary text-white text-xs font-bold px-3 py-1 rounded-full',
        className
      )}
    >
      {label}
    </span>
  )
}
