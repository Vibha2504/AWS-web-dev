import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight, Calendar, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatEventDate, formatTime } from '@/lib/format'
import type { CampusEvent } from '@/lib/types'
import { CategoryBadge } from '@/components/category-badge'
import { CapacityGauge, getCapacityState } from '@/components/capacity-gauge'
import { buttonVariants } from '@/components/ui/button'

export function EventCard({ event }: { event: CampusEvent }) {
  const state = getCapacityState(event.registered, event.capacity)
  const soldOut = state === 'sold-out'

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-slate-700">
      <div className="relative aspect-[16/9] overflow-hidden">
        <Image
          src={event.coverImage}
          alt=""
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className={cn('object-cover transition-transform duration-500 group-hover:scale-[1.03]', soldOut && 'grayscale-[60%]')}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/10 to-transparent" />
        <div className="absolute top-3 left-3">
          <CategoryBadge category={event.category} className="bg-background/80 backdrop-blur" />
        </div>
        {soldOut && (
          <span className="absolute top-3 right-3 rounded-md border border-danger/40 bg-danger/90 px-2 py-1 text-xs font-bold tracking-widest text-white">
            SOLD OUT
          </span>
        )}
        {state === 'almost-full' && (
          <span className="absolute top-3 right-3 rounded-md border border-warning/40 bg-background/80 px-2 py-1 text-xs font-semibold text-warning backdrop-blur">
            Almost full
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex flex-col gap-1.5">
          <h3 className="text-pretty font-semibold leading-snug">
            <Link href={`/events/${event.slug}`} className="after:absolute after:inset-0 focus:outline-none">
              {event.title}
            </Link>
          </h3>
          <p className="line-clamp-2 text-sm text-muted-foreground">{event.tagline}</p>
        </div>

        <ul className="flex flex-col gap-1.5 text-sm text-muted-foreground">
          <li className="flex items-center gap-2">
            <Calendar className="size-4 shrink-0" aria-hidden="true" />
            {formatEventDate(event.startsAt)} · {formatTime(event.startsAt)}
          </li>
          <li className="flex items-center gap-2">
            <MapPin className="size-4 shrink-0" aria-hidden="true" />
            <span className="truncate">{event.venue}</span>
          </li>
        </ul>

        <CapacityGauge registered={event.registered} capacity={event.capacity} className="mt-auto" />

        {soldOut ? (
          <span
            aria-disabled="true"
            className={cn(buttonVariants({ variant: 'secondary' }), 'pointer-events-none h-9 w-full opacity-60')}
          >
            Registration closed
          </span>
        ) : (
          <Link
            href={`/events/${event.slug}`}
            className={cn(buttonVariants(), 'relative z-10 h-9 w-full')}
          >
            Reserve spot
            <ArrowUpRight aria-hidden="true" />
          </Link>
        )}
      </div>
    </article>
  )
}
