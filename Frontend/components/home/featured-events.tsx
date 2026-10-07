import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { CampusEvent } from '@/lib/types'
import { EventCard } from '@/components/events/event-card'

export function FeaturedEvents({ events }: { events: CampusEvent[] }) {
  return (
    <section aria-labelledby="featured-heading" className="border-b border-border">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h2 id="featured-heading" className="text-2xl font-semibold tracking-tight">
              Upcoming on campus
            </h2>
            <p className="text-sm text-muted-foreground">Seats are limited. Reserve before they fill up.</p>
          </div>
          <Link href="/events" className="hidden items-center gap-1 text-sm text-primary hover:underline sm:flex">
            View all events
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
        <Link href="/events" className="mt-6 flex items-center gap-1 text-sm text-primary hover:underline sm:hidden">
          View all events
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
    </section>
  )
}
