import { cn } from '@/lib/utils'

interface CapacityGaugeProps {
  registered: number
  capacity: number
  className?: string
}

export function getCapacityState(registered: number, capacity: number) {
  const remaining = Math.max(capacity - registered, 0)
  if (remaining === 0) return 'sold-out' as const
  if (remaining <= Math.max(5, capacity * 0.05)) return 'almost-full' as const
  return 'open' as const
}

export function CapacityGauge({ registered, capacity, className }: CapacityGaugeProps) {
  const remaining = Math.max(capacity - registered, 0)
  const pct = Math.min((registered / capacity) * 100, 100)
  const state = getCapacityState(registered, capacity)

  const barColor =
    state === 'sold-out' ? 'bg-danger' : state === 'almost-full' ? 'bg-warning' : 'bg-primary'
  const remainingText =
    state === 'sold-out'
      ? 'No spots remaining'
      : `${remaining} spot${remaining === 1 ? '' : 's'} remaining`

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span>
          <span className="font-semibold tabular-nums">{registered}</span>
          <span className="text-muted-foreground tabular-nums"> / {capacity} registered</span>
        </span>
        <span
          className={cn(
            'text-xs font-medium tabular-nums',
            state === 'sold-out' && 'text-danger',
            state === 'almost-full' && 'text-warning',
            state === 'open' && 'text-muted-foreground',
          )}
        >
          {remainingText}
        </span>
      </div>
      <div
        role="progressbar"
        aria-label="Registration capacity"
        aria-valuemin={0}
        aria-valuemax={capacity}
        aria-valuenow={registered}
        aria-valuetext={`${registered} of ${capacity} registered, ${remainingText}`}
        className="h-1.5 w-full overflow-hidden rounded-full bg-secondary"
      >
        <div className={cn('h-full rounded-full transition-all duration-500', barColor)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
