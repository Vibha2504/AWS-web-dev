'use client'

import Link from 'next/link'
import { useState } from 'react'
import useSWR from 'swr'
import {
  CalendarDays,
  Plus,
  ScanLine,
  Search,
  Filter,
  Users,
  Eye,
  MapPin,
  ExternalLink,
} from 'lucide-react'
import { getOrganizerEvents } from '@/lib/api'
import { buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CategoryBadge } from '@/components/category-badge'
import { formatDateShort, formatTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { CampusEvent } from '@/lib/types'

export default function OrganizerEventsPage() {
  const { data: events, isLoading } = useSWR('organizer-events', getOrganizerEvents)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OPEN' | 'SOLD_OUT' | 'LIVE'>('ALL')

  const filteredEvents = events?.filter((evt) => {
    const isFull = evt.registered >= evt.capacity
    const isLive = evt.slug === 'hacksprint-2026'

    if (statusFilter === 'OPEN' && (isFull || isLive)) return false
    if (statusFilter === 'SOLD_OUT' && !isFull) return false
    if (statusFilter === 'LIVE' && !isLive) return false

    if (search) {
      const q = search.toLowerCase()
      return (
        evt.title.toLowerCase().includes(q) ||
        evt.venue.toLowerCase().includes(q) ||
        evt.category.toLowerCase().includes(q)
      )
    }
    return true
  })

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Event Management
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Configure campus venues, registration capacities, and ticket issuance policies.
          </p>
        </div>

        <Link
          href="/organizer/events/new"
          className={buttonVariants({ size: 'sm' })}
        >
          <Plus className="size-4" />
          <span>Create New Event</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search events, venues, categories..."
            className="pl-9 h-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(
            [
              { id: 'ALL', label: 'All Events' },
              { id: 'LIVE', label: 'Live Gate' },
              { id: 'OPEN', label: 'Open' },
              { id: 'SOLD_OUT', label: 'Sold Out' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap',
                statusFilter === tab.id
                  ? 'bg-secondary text-foreground font-semibold border border-border'
                  : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Events Table Container */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/40 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="py-3 px-4 sm:px-6">Event Details</th>
                <th className="py-3 px-4">Date & Schedule</th>
                <th className="py-3 px-4">Capacity Status</th>
                <th className="py-3 px-4">Lifecycle Status</th>
                <th className="py-3 px-4 sm:px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoading && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-sm text-muted-foreground">
                    Loading events catalog...
                  </td>
                </tr>
              )}
              {filteredEvents?.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-sm text-muted-foreground">
                    No campus events match your filter.
                  </td>
                </tr>
              )}
              {filteredEvents?.map((evt) => {
                const isFull = evt.registered >= evt.capacity
                const isLive = evt.slug === 'hacksprint-2026'
                const pct = Math.round((evt.registered / evt.capacity) * 100)

                return (
                  <tr key={evt.id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-4 px-4 sm:px-6">
                      <div className="font-semibold text-foreground text-sm">{evt.title}</div>
                      <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                        {evt.tagline}
                      </div>
                      <div className="flex items-center gap-2 mt-1.5 text-xs">
                        <CategoryBadge category={evt.category} />
                        <span className="text-muted-foreground">•</span>
                        <span className="text-muted-foreground flex items-center gap-1">
                          <MapPin className="size-3" />
                          {evt.venue}
                        </span>
                      </div>
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap text-xs text-muted-foreground">
                      <div className="font-medium text-foreground">{formatDateShort(evt.startsAt)}</div>
                      <div>{formatTime(evt.startsAt)} - {formatTime(evt.endsAt)}</div>
                    </td>

                    <td className="py-4 px-4 min-w-[150px]">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-mono font-medium">
                          {evt.registered} / {evt.capacity}
                        </span>
                        <span className="text-[11px] text-muted-foreground">{pct}%</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all',
                            isFull ? 'bg-rose-500' : pct >= 80 ? 'bg-amber-500' : 'bg-primary',
                          )}
                          style={{ width: `${Math.min(100, pct)}%` }}
                        />
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-1">
                        {isFull ? 'No spots remaining' : `${evt.capacity - evt.registered} spots left`}
                      </div>
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap">
                      {isLive ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/25">
                          <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Live Gate
                        </span>
                      ) : isFull ? (
                        <span className="inline-flex items-center rounded-full bg-rose-500/15 px-2.5 py-0.5 text-xs font-semibold text-rose-400 border border-rose-500/25">
                          Sold Out
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-sky-500/15 px-2.5 py-0.5 text-xs font-semibold text-sky-400 border border-sky-500/25">
                          Open
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-4 sm:px-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/organizer/events/${evt.id}`}
                          className={buttonVariants({ variant: 'ghost', size: 'sm' })}
                          title="View event metrics & attendees"
                        >
                          <Eye className="size-3.5" />
                          <span>View</span>
                        </Link>
                        <Link
                          href="/organizer/scan"
                          className={buttonVariants({ variant: 'outline', size: 'sm' })}
                          title="Open gate scanner"
                        >
                          <ScanLine className="size-3.5 text-emerald-400" />
                          <span>Scan</span>
                        </Link>
                        <Link
                          href={`/events/${evt.slug}`}
                          target="_blank"
                          className={buttonVariants({ variant: 'ghost', size: 'icon' })}
                          title="Open public page"
                        >
                          <ExternalLink className="size-3.5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
