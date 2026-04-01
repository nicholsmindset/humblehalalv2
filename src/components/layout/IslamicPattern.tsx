import { cn } from '@/lib/utils'

interface IslamicPatternProps {
  opacity?: number
  className?: string
}

export function IslamicPattern({ opacity = 0.1, className }: IslamicPatternProps) {
  return (
    <div
      className={cn('islamic-pattern pointer-events-none absolute inset-0', className)}
      style={{ opacity }}
      aria-hidden="true"
    />
  )
}
