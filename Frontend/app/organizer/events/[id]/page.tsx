'use client'

import { use } from 'react'
import Link from 'next/link'
import useSWR from 'swr'
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  MapPin,
  Percent,
  ScanLine,
  TrendingUp,
  Users,
} from 'lucide-react'
import { getEvent, getAllRegistrations } from '@/lib/api'
import { buttonVariants } from '@/components/ui/button'
import { CategoryBadge } from '@/components/category-badge'
import { formatDateShort, formatTime } from '@/lib/format'
import { cn } from '@/lib/utils'

export default function EventAnalyticsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { data: event } = useSWR(['event-detail', id], () => getEvent(id))
  const { data: allRecords } = useSWR('all-registrations', getAllRegistrations)

  if (!event) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center">
        <div className="text-muted-foreground text-sm">Loading event telemetry...</div>
      </div>
    )
  }

  // Calculate stats for this specific event
  const attendees = allRecords?.filter((r) => r.ticket.eventId === event.id) || []
  const checkedInCount = attendees.filter((a) => a.ticket.checkedInAt).length
  const registeredCount = event.registered
  const capacity = event.capacity
  const remaining = Math.max(0, registeredCount - checkedInCount)
  const attendancePct =
    registeredCount > 0 ? Math.round((checkedInCount / registeredCount) * 1000) / 10 : 0
  const capacityPct = Math.round((registeredCount / capacity) * 100)

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Back button & Event Header */}
      <div className="flex flex-col gap-2">
        <Link
          href="/organizer/events"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors w-fit"
        >
          <ArrowLeft className="size-3.5" />
          <span>Back to Event Directory</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <CategoryBadge category={event.category} />
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="size-3" />
                {event.venue}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {event.title}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              {formatDateShort(event.startsAt)} • {formatTime(event.startsAt)} - {formatTime(event.endsAt)}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/organizer/scan"
              className={buttonVariants({ size: 'sm' })}
            >
              <ScanLine className="size-4" />
              <span>Launch Gate Scanner</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Top 4 Metric Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Registrations</span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-sky-500/10 border border-sky-500/20">
              <Users className="size-3.5 text-sky-400" />
            </div>
          </div>
          <div className="mt-3">
            <div className="font-mono text-2xl font-bold text-foreground">{registeredCount}</div>
            <div className="text-[11px] text-muted-foreground">Out of {capacity} seats</div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Venue Capacity</span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-indigo-500/10 border border-indigo-500/20">
              <CalendarDays className="size-3.5 text-indigo-400" />
            </div>
          </div>
          <div className="mt-3">
            <div className="font-mono text-2xl font-bold text-foreground">{capacity}</div>
            <div className="text-[11px] text-muted-foreground">{capacityPct}% fill rate</div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Checked In</span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <CheckCircle2 className="size-3.5 text-emerald-400" />
            </div>
          </div>
          <div className="mt-3">
            <div className="font-mono text-2xl font-bold text-emerald-400">{checkedInCount}</div>
            <div className="text-[11px] text-muted-foreground">{remaining} pending arrival</div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Attendance Rate</span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-purple-500/10 border border-purple-500/20">
              <Percent className="size-3.5 text-purple-400" />
            </div>
          </div>
          <div className="mt-3">
            <div className="font-mono text-2xl font-bold text-purple-400">{attendancePct}%</div>
            <div className="text-[11px] text-muted-foreground">Turnout conversion</div>
          </div>
        </div>
      </div>

      {/* Capacity & Check-in Progress Bar */}
      <div className="rounded-xl border border-border bg-card p-5 sm:p-6 shadow-sm flex flex-col gap-3">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-foreground">Venue Capacity Distribution</span>
          <span className="font-mono text-xs text-muted-foreground">
            {registeredCount} / {capacity} Registered ({capacity - registeredCount} remaining)
          </span>
        </div>

        <div className="h-3 w-full rounded-full bg-secondary overflow-hidden flex">
          <div
            className="h-full bg-emerald-500 transition-all"
            style={{ width: `${Math.min(100, (checkedInCount / capacity) * 100)}%` }}
            title={`Checked In: ${checkedInCount}`}
          />
          <div
            className="h-full bg-sky-500 transition-all"
            style={{
              width: `${Math.min(
                100,
                ((registeredCount - checkedInCount) / capacity) * 100,
              )}%`,
            }}
            title={`Pending: ${remaining}`}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-emerald-500" />
              Verified & Checked In ({checkedInCount})
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-sky-500" />
              Pending Arrival ({remaining})
            </span>
          </div>
          <span>Venue Cap: {capacity}</span>
        </div>
      </div>

      {/* Attendee Roster Table */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="border-b border-border p-4 sm:px-6">
          <h2 className="text-base font-semibold">Registered Attendees Roster</h2>
          <p className="text-xs text-muted-foreground">
            Student ticket passes generated for this specific session
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/40 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="py-3 px-4 sm:px-6">Attendee</th>
                <th className="py-3 px-4">Student ID</th>
                <th className="py-3 px-4">Ticket Serial</th>
                <th className="py-3 px-4">Seat / Table</th>
                <th className="py-3 px-4 sm:px-6 text-right">Check-In Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {attendees.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                    No individual tickets found for this event in seed data.
                  </td>
                </tr>
              )}
              {attendees.map(({ ticket }) => {
                const isCheckedIn = !!ticket.checkedInAt
                return (
                  <tr key={ticket.code} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="font-medium text-foreground">{ticket.attendee.fullName}</div>
                      <div className="text-xs text-muted-foreground">{ticket.attendee.email}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-muted-foreground">
                      {ticket.attendee.studentId}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-sky-400">
                      {ticket.code}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-muted-foreground">
                      {ticket.seat}
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 text-right whitespace-nowrap">
                      {isCheckedIn ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/25">
                          <CheckCircle2 className="size-3" />
                          Checked In
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold text-amber-400 border border-amber-500/25">
                          <Clock className="size-3" />
                          Pending
                        </span>
                      )}
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
