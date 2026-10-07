'use client'

import Image from 'next/image'
import Link from 'next/link'
import useSWR from 'swr'
import { ArrowLeft, Building2, Calendar, Check, Clock, MapPin } from 'lucide-react'
import { getEvent } from '@/lib/api'
import { formatEventDate, formatTimeRange } from '@/lib/format'
import type { CampusEvent } from '@/lib/types'
import { CategoryBadge } from '@/components/category-badge'
import { RegistrationPanel } from '@/components/events/registration-panel'

export function EventDetail({ initialEvent }: { initialEvent: CampusEvent }) {
  const { data } = useSWR(['event', initialEvent.slug], () => getEvent(initialEvent.slug), {
    fallbackData: initialEvent,
    revalidateOnMount: true,
  })
  const event = data ?? initialEvent

  return (
    <main>
      <div className="relative h-56 border-b border-border sm:h-72 md:h-80">
        <Image src={event.coverImage} alt="" fill priority sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/10" />
        <div className="absolute inset-x-0 top-0 mx-auto max-w-6xl px-4 pt-6 sm:px-6">
          <Link
            href="/events"
            className="inline-flex items-center gap-1.5 rounded-md bg-background/70 px-2.5 py-1.5 text-sm text-muted-foreground backdrop-blur hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            All events
          </Link>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl gap-10 px-4 pb-16 sm:px-6 lg:grid-cols-[1fr_380px]">
        <div className="-mt-16 relative flex flex-col gap-10">
          <header className="flex flex-col gap-4">
            <CategoryBadge category={event.category} className="w-fit" />
            <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">{event.title}</h1>
            <p className="text-pretty text-lg text-muted-foreground">{event.tagline}</p>
          </header>

          <dl className="grid gap-4 rounded-xl border border-border bg-card p-5 sm:grid-cols-2">
            <Meta icon={Calendar} label="Date" value={formatEventDate(event.startsAt)} />
            <Meta icon={Clock} label="Time" value={formatTimeRange(event.startsAt, event.endsAt)} />
            <Meta icon={MapPin} label="Venue" value={event.venue} sub={event.address} />
            <Meta icon={Building2} label="Organized by" value={event.organizer} />
          </dl>

          <section aria-labelledby="about-heading" className="flex flex-col gap-4">
            <h2 id="about-heading" className="text-lg font-semibold">About</h2>
            <p className="leading-relaxed text-muted-foreground">{event.description}</p>
            <ul className="grid gap-2 sm:grid-cols-2">
              {event.highlights.map((h) => (
                <li key={h} className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
                  {h}
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="schedule-heading" className="flex flex-col gap-4">
            <h2 id="schedule-heading" className="text-lg font-semibold">Schedule</h2>
            <ol className="flex flex-col">
              {event.schedule.map((item, i) => (
                <li key={`${item.time}-${item.title}`} className="relative flex gap-4 pb-6 last:pb-0">
                  {i < event.schedule.length - 1 && (
                    <span aria-hidden="true" className="absolute top-3 left-[5px] h-full w-px bg-border" />
                  )}
                  <span aria-hidden="true" className="relative mt-1.5 size-[11px] shrink-0 rounded-full border-2 border-primary bg-background" />
                  <div className="flex flex-col gap-0.5">
                    <span className="font-mono text-xs text-muted-foreground">{item.time}</span>
                    <span className="font-medium">{item.title}</span>
                    {item.description && <span className="text-sm text-muted-foreground">{item.description}</span>}
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section aria-labelledby="venue-heading" className="flex flex-col gap-3">
            <h2 id="venue-heading" className="text-lg font-semibold">Venue</h2>
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="font-medium">{event.venue}</p>
              <p className="mt-1 text-sm text-muted-foreground">{event.venueDetails}</p>
              <p className="mt-3 text-sm text-muted-foreground">{event.address}</p>
            </div>
          </section>
        </div>

        <aside className="lg:-mt-16 lg:relative">
          <div className="lg:sticky lg:top-20">
            <RegistrationPanel event={event} />
          </div>
        </aside>
      </div>
    </main>
  )
}

function Meta({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' }>
  label: string
  value: string
  sub?: string
}) {
  return (
    <div className="flex gap-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <div className="flex min-w-0 flex-col gap-0.5">
        <dt className="text-xs uppercase tracking-wider text-muted-foreground">{label}</dt>
        <dd className="text-sm font-medium">{value}</dd>
        {sub && <dd className="text-xs text-muted-foreground">{sub}</dd>}
      </div>
    </div>
  )
}
