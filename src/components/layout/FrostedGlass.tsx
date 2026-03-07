import { cn } from '@/lib/utils'

interface FrostedGlassProps {
  children: React.ReactNode
  className?: string
}

export function FrostedGlass({ children, className }: FrostedGlassProps) {
  return (
    <div className={cn('frosted-glass', className)}>
      {children}
    </div>
  )
}
