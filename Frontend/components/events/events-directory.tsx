'use client'

import { useMemo, useState } from 'react'
import useSWR from 'swr'
import { Search, SearchX } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getEvents } from '@/lib/api'
import { CATEGORIES } from '@/lib/mock-data'
import type { CampusEvent, EventCategory } from '@/lib/types'
import { EventCard } from '@/components/events/event-card'
import { Input } from '@/components/ui/input'

type Filter = 'All' | EventCategory

export function EventsDirectory({ initialEvents }: { initialEvents: CampusEvent[] }) {
  const { data: events = initialEvents } = useSWR('events', getEvents, {
    fallbackData: initialEvents,
    revalidateOnMount: true,
  })
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<Filter>('All')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return events.filter((e) => {
      if (category !== 'All' && e.category !== category) return false
      if (!q) return true
      return [e.title, e.tagline, e.venue, e.organizer].some((v) => v.toLowerCase().includes(q))
    })
  }, [events, query, category])

  return (
    <div className="mt-8 flex flex-col gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative md:w-80">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <label htmlFor="event-search" className="sr-only">Search events</label>
          <Input
            id="event-search"
            type="search"
            placeholder="Search events, venues, organizers"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-10 pl-9"
          />
        </div>
        <div role="group" aria-label="Filter by category" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0 md:pb-0">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              aria-pressed={category === c}
              onClick={() => setCategory(c)}
              className={cn(
                'h-9 shrink-0 rounded-full border px-4 text-sm transition-colors',
                category === c
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card text-muted-foreground hover:text-foreground',
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <p className="text-sm text-muted-foreground" aria-live="polite">
        {filtered.length} event{filtered.length === 1 ? '' : 's'}
      </p>

      {filtered.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
          <SearchX className="size-8 text-muted-foreground" aria-hidden="true" />
          <p className="font-medium">No events match your filters</p>
          <button
            type="button"
            onClick={() => {
              setQuery('')
              setCategory('All')
            }}
            className="text-sm text-primary hover:underline"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  )
}
