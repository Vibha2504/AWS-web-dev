import { cn } from '@/lib/utils'
import type { EventCategory } from '@/lib/types'

const STYLES: Record<EventCategory, string> = {
  Hackathons: 'border-primary/30 bg-primary/10 text-indigo-300',
  Bootcamps: 'border-info/30 bg-info/10 text-sky-300',
  Conferences: 'border-violet-400/30 bg-violet-400/10 text-violet-300',
  'Security Labs': 'border-success/30 bg-success/10 text-emerald-300',
}

export function CategoryBadge({ category, className }: { category: EventCategory; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex h-6 shrink-0 items-center rounded-full border px-2.5 text-xs font-medium',
        STYLES[category],
        className,
      )}
    >
      {category}
    </span>
  )
}
