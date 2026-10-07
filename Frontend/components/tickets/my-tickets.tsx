'use client'

import Image from 'next/image'
import Link from 'next/link'
import useSWR from 'swr'
import { ArrowRight, CalendarPlus, CheckCircle2, Clock, History } from 'lucide-react'
import { getMyTickets, isPastEvent } from '@/lib/api'
import { formatEventDate, formatTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { RegistrationResponse } from '@/lib/types'
import { buttonVariants } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CategoryBadge } from '@/components/category-badge'

type Bucket = 'upcoming' | 'checked-in' | 'past'

function bucketOf({ ticket, event }: RegistrationResponse): Bucket {
  if (isPastEvent(event)) return 'past'
  return ticket.checkedInAt ? 'checked-in' : 'upcoming'
}

const TABS: { value: Bucket; label: string; empty: string }[] = [
  { value: 'upcoming', label: 'Upcoming', empty: 'No upcoming passes. Reserve a spot to see it here.' },
  { value: 'checked-in', label: 'Checked In', empty: 'Passes you’ve scanned in today will show up here.' },
  { value: 'past', label: 'Past', empty: 'Your attended events will be archived here.' },
]

export function MyTickets() {
  const { data, isLoading } = useSWR('my-tickets', getMyTickets)

  if (isLoading || !data) {
    return (
      <div className="mt-8 grid gap-4 md:grid-cols-2" aria-busy="true">
        {[0, 1].map((i) => (
          <div key={i} className="h-32 animate-pulse rounded-xl bg-card" />
        ))}
      </div>
    )
  }

  const grouped: Record<Bucket, RegistrationResponse[]> = { upcoming: [], 'checked-in': [], past: [] }
  for (const item of data) grouped[bucketOf(item)].push(item)

  return (
    <Tabs defaultValue="upcoming" className="mt-8 gap-6">
      <TabsList>
        {TABS.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value} className="px-3">
            {tab.label}
            <span className="ml-1.5 rounded bg-background/60 px-1.5 font-mono text-xs text-muted-foreground">
              {grouped[tab.value].length}
            </span>
          </TabsTrigger>
        ))}
      </TabsList>

      {TABS.map((tab) => (
        <TabsContent key={tab.value} value={tab.value}>
          {grouped[tab.value].length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
              <CalendarPlus className="size-8 text-muted-foreground" aria-hidden="true" />
              <p className="max-w-xs text-sm text-muted-foreground">{tab.empty}</p>
              {tab.value === 'upcoming' && (
                <Link href="/events" className={cn(buttonVariants(), 'h-10 px-4')}>
                  Browse events
                </Link>
              )}
            </div>
          ) : (
            <ul className="grid gap-4 md:grid-cols-2">
              {grouped[tab.value].map((item) => (
                <TicketRow key={item.ticket.code} item={item} bucket={tab.value} />
              ))}
            </ul>
          )}
        </TabsContent>
      ))}
    </Tabs>
  )
}

function TicketRow({ item: { ticket, event }, bucket }: { item: RegistrationResponse; bucket: Bucket }) {
  return (
    <li>
      <Link
        href={`/tickets/${ticket.code}`}
        className={cn(
          'group flex overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-slate-700',
          bucket === 'past' && 'opacity-80',
        )}
      >
        <div className="relative w-28 shrink-0 sm:w-36">
          <Image
            src={event.coverImage}
            alt=""
            fill
            sizes="144px"
            className={cn('object-cover', bucket === 'past' && 'grayscale')}
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2 p-4">
          <div className="flex items-center justify-between gap-2">
            <CategoryBadge category={event.category} />
            <StatusTag bucket={bucket} attended={Boolean(ticket.checkedInAt)} />
          </div>
          <p className="truncate font-semibold">{event.title}</p>
          <p className="text-sm text-muted-foreground">
            {formatEventDate(event.startsAt)} · {formatTime(event.startsAt)}
          </p>
          <div className="mt-auto flex items-center justify-between">
            <span className="font-mono text-xs text-muted-foreground">{ticket.code}</span>
            <ArrowRight
              className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </div>
        </div>
      </Link>
    </li>
  )
}

function StatusTag({ bucket, attended }: { bucket: Bucket; attended: boolean }) {
  if (bucket === 'checked-in') {
    return (
      <span className="flex items-center gap-1 text-xs text-success">
        <CheckCircle2 className="size-3.5" aria-hidden="true" />
        Checked in
      </span>
    )
  }
  if (bucket === 'past') {
    return (
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <History className="size-3.5" aria-hidden="true" />
        {attended ? 'Attended' : 'Missed'}
      </span>
    )
  }
  return (
    <span className="flex items-center gap-1 text-xs text-info">
      <Clock className="size-3.5" aria-hidden="true" />
      Upcoming
    </span>
  )
}
