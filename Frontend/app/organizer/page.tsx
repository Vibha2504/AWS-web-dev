'use client'

import Link from 'next/link'
import useSWR from 'swr'
import {
  CalendarDays,
  Plus,
  ScanLine,
  ArrowRight,
  TrendingUp,
  MapPin,
  CheckCircle2,
} from 'lucide-react'
import { getOrganizerEvents, getOrganizerStats } from '@/lib/api'
import { StatsCards } from '@/components/organizer/stats-cards'
import { buttonVariants } from '@/components/ui/button'
import { CapacityGauge } from '@/components/capacity-gauge'
import { CategoryBadge } from '@/components/category-badge'
import { formatDateShort, formatTime } from '@/lib/format'
import { cn } from '@/lib/utils'

export default function OrganizerDashboardPage() {
  const { data: stats } = useSWR('organizer-stats', getOrganizerStats, {
    refreshInterval: 10_000,
  })
  const { data: events } = useSWR('organizer-events', getOrganizerEvents)

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Top Welcome Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Good morning, Organizer
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Campus event ticketing telemetry and real-time gate authentication control.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/organizer/scan"
            className={buttonVariants({ variant: 'outline', size: 'sm' })}
          >
            <ScanLine className="size-4 text-emerald-400" />
            <span>Open Gate Scanner</span>
          </Link>
          <Link
            href="/organizer/events/new"
            className={buttonVariants({ size: 'sm' })}
          >
            <Plus className="size-4" />
            <span>Create Event</span>
          </Link>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <StatsCards stats={stats} />

      {/* Grid: Left Upcoming Events Table | Right Live Capacity Fill */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Upcoming Events Table */}
        <div className="lg:col-span-2 flex flex-col rounded-xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b border-border p-4 sm:px-6">
            <div>
              <h2 className="text-base font-semibold">Active Campus Events</h2>
              <p className="text-xs text-muted-foreground">
                Managed university sessions and live check-in progress
              </p>
            </div>
            <Link
              href="/organizer/events"
              className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowRight className="size-3" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-muted/40 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="py-3 px-4 sm:px-6">Event</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Capacity</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {!events && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground text-sm">
                      Loading campus events...
                    </td>
                  </tr>
                )}
                {events?.slice(0, 5).map((evt) => {
                  const isFull = evt.registered >= evt.capacity
                  const pct = Math.round((evt.registered / evt.capacity) * 100)

                  return (
                    <tr key={evt.id} className="hover:bg-muted/20 transition-colors">
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="font-medium text-foreground">{evt.title}</div>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                          <CategoryBadge category={evt.category} />
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <MapPin className="size-3" />
                            {evt.venue}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap text-xs text-muted-foreground">
                        <div>{formatDateShort(evt.startsAt)}</div>
                        <div>{formatTime(evt.startsAt)}</div>
                      </td>
                      <td className="py-3.5 px-3 min-w-[130px]">
                        <div className="flex items-center justify-between text-xs mb-1">
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
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span
                          className={cn(
                            'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold',
                            isFull
                              ? 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                              : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20',
                          )}
                        >
                          {isFull ? 'Sold Out' : 'Registration Open'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 sm:px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/organizer/events/${evt.id}`}
                            className={buttonVariants({ variant: 'ghost', size: 'sm' })}
                          >
                            Analytics
                          </Link>
                          <Link
                            href="/organizer/scan"
                            className={buttonVariants({ variant: 'secondary', size: 'sm' })}
                          >
                            <ScanLine className="size-3.5" />
                            <span>Scan</span>
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

        {/* Right Card: Live Capacity & Gate Summary */}
        <div className="flex flex-col gap-5">
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">Active Gate Live Status</h3>
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-400">
                <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live: Gate #1
              </span>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              HackSprint 2026 is currently accepting attendee check-ins at Innovation Hub.
            </p>

            <div className="rounded-lg bg-secondary/40 p-3.5 border border-border/80 flex flex-col gap-2.5">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Target Event</span>
                <span className="font-semibold text-foreground">HackSprint 2026</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Baseline Check-ins</span>
                <span className="font-mono text-emerald-400 font-semibold">95 verified</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Security Algorithm</span>
                <span className="font-mono text-xs text-sky-400">HMAC-SHA256</span>
              </div>
            </div>

            <Link
              href="/organizer/scan"
              className={cn(buttonVariants({ size: 'sm' }), 'w-full mt-4')}
            >
              <ScanLine className="size-4" />
              <span>Launch Live Viewfinder</span>
            </Link>
          </div>

          {/* Quick Actions Card */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm flex flex-col gap-3">
            <h3 className="text-sm font-semibold">Organizer Quick Actions</h3>
            <div className="flex flex-col gap-2">
              <Link
                href="/organizer/registrations"
                className="flex items-center justify-between p-2.5 rounded-lg border border-border hover:bg-secondary/60 text-xs font-medium transition-colors"
              >
                <span>Attendee Directory & Search</span>
                <ArrowRight className="size-3.5 text-muted-foreground" />
              </Link>
              <Link
                href="/organizer/check-ins"
                className="flex items-center justify-between p-2.5 rounded-lg border border-border hover:bg-secondary/60 text-xs font-medium transition-colors"
              >
                <span>Gate Audit Trail & Duplicates</span>
                <ArrowRight className="size-3.5 text-muted-foreground" />
              </Link>
              <Link
                href="/events"
                target="_blank"
                className="flex items-center justify-between p-2.5 rounded-lg border border-border hover:bg-secondary/60 text-xs font-medium transition-colors"
              >
                <span>View Public Events Directory</span>
                <ArrowRight className="size-3.5 text-muted-foreground" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
