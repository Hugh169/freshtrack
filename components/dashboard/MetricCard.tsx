import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MetricCardProps {
  title: string
  value: string
  subtitle?: string
  icon: LucideIcon
  variant?: 'default' | 'danger' | 'warning' | 'success'
  className?: string
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'default',
  className,
}: MetricCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-zinc-200 bg-white p-5',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-zinc-500">{title}</p>
        <div
          className={cn(
            'rounded-lg p-2',
            variant === 'danger' && 'bg-red-50 text-red-600',
            variant === 'warning' && 'bg-amber-50 text-amber-600',
            variant === 'success' && 'bg-green-50 text-green-600',
            variant === 'default' && 'bg-zinc-100 text-zinc-600'
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p
        className={cn(
          'mt-3 text-2xl font-bold tabular-nums',
          variant === 'danger' && 'text-red-600',
          variant === 'warning' && 'text-amber-600',
          variant === 'success' && 'text-green-600',
          variant === 'default' && 'text-zinc-900'
        )}
      >
        {value}
      </p>
      {subtitle && <p className="mt-1 text-xs text-zinc-400">{subtitle}</p>}
    </div>
  )
}
