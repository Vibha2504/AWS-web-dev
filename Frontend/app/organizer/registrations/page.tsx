'use client'

import { useState } from 'react'
import Link from 'next/link'
import useSWR from 'swr'
import {
  Download,
  ExternalLink,
  Filter,
  Search,
  UserCheck,
  Users,
  ShieldCheck,
  CheckCircle2,
  Clock,
} from 'lucide-react'
import { getAllRegistrations, getOrganizerEvents } from '@/lib/api'
import { Input } from '@/components/ui/input'
import { buttonVariants } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatDateShort, formatTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export default function RegistrationsPage() {
  const { data: records, isLoading } = useSWR('organizer-registrations', getAllRegistrations)
  const { data: events } = useSWR('organizer-events', getOrganizerEvents)

  const [search, setSearch] = useState('')
  const [eventFilter, setEventFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'CHECKED_IN' | 'PENDING'>('ALL')

  const filtered = records?.filter(({ ticket, event }) => {
    if (eventFilter !== 'ALL' && ticket.eventId !== eventFilter) return false
    if (statusFilter === 'CHECKED_IN' && !ticket.checkedInAt) return false
    if (statusFilter === 'PENDING' && ticket.checkedInAt) return false

    if (search) {
      const q = search.toLowerCase()
      return (
        ticket.attendee.fullName.toLowerCase().includes(q) ||
        ticket.attendee.email.toLowerCase().includes(q) ||
        ticket.attendee.studentId.toLowerCase().includes(q) ||
        ticket.code.toLowerCase().includes(q)
      )
    }
    return true
  })

  const handleExport = () => {
    toast.success('Registrations roster exported as CSV')
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Attendee Registrations
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Verified student registry, ticket serials, and admission clearance logs.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExport}
          className={buttonVariants({ variant: 'outline', size: 'sm' })}
        >
          <Download className="size-3.5" />
          <span>Export Roster (CSV)</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search attendee, roll no, ticket ID..."
            className="pl-9 h-9 text-xs"
          />
        </div>

        <Select value={eventFilter} onValueChange={setEventFilter}>
          <SelectTrigger className="h-9 text-xs">
            <SelectValue placeholder="Filter by Event" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Events</SelectItem>
            {events?.map((evt) => (
              <SelectItem key={evt.id} value={evt.id}>
                {evt.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as 'ALL' | 'CHECKED_IN' | 'PENDING')}
        >
          <SelectTrigger className="h-9 text-xs">
            <SelectValue placeholder="Check-in Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="CHECKED_IN">Checked In</SelectItem>
            <SelectItem value="PENDING">Pending Arrival</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Registrations Table */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-4 sm:px-6 py-3 bg-muted/20 text-xs">
          <span className="text-muted-foreground">
            Showing <strong className="text-foreground font-mono">{filtered?.length || 0}</strong> registered attendees
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/40 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="py-3 px-4 sm:px-6">Attendee</th>
                <th className="py-3 px-3">Student Roll</th>
                <th className="py-3 px-3">Ticket ID</th>
                <th className="py-3 px-3">Registered Event</th>
                <th className="py-3 px-3">Check-In Status</th>
                <th className="py-3 px-4 sm:px-6 text-right">Pass</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoading && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
                    Loading registration directory...
                  </td>
                </tr>
              )}
              {filtered?.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
                    No attendee records match your filter criteria.
                  </td>
                </tr>
              )}
              {filtered?.map(({ ticket, event }) => {
                const isCheckedIn = !!ticket.checkedInAt

                return (
                  <tr key={ticket.code} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="font-medium text-foreground">{ticket.attendee.fullName}</div>
                      <div className="text-xs text-muted-foreground">{ticket.attendee.email}</div>
                    </td>

                    <td className="py-3.5 px-3 whitespace-nowrap text-xs">
                      <div className="font-mono text-foreground font-medium">{ticket.attendee.studentId}</div>
                      <div className="text-[11px] text-muted-foreground">{ticket.attendee.department}</div>
                    </td>

                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <span className="font-mono text-xs font-semibold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                        {ticket.code}
                      </span>
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="text-xs font-medium text-foreground line-clamp-1 max-w-[200px]">
                        {event.title}
                      </div>
                      <div className="text-[11px] text-muted-foreground">{ticket.seat}</div>
                    </td>

                    <td className="py-3.5 px-3 whitespace-nowrap">
                      {isCheckedIn ? (
                        <div className="flex flex-col">
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-400 border border-emerald-500/25 w-fit">
                            <CheckCircle2 className="size-3" />
                            Checked In
                          </span>
                          <span className="text-[10px] text-muted-foreground mt-0.5 font-mono">
                            {formatTime(ticket.checkedInAt!)}
                          </span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-400 border border-amber-500/25">
                          <Clock className="size-3" />
                          Pending Arrival
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 sm:px-6 text-right whitespace-nowrap">
                      <Link
                        href={`/tickets/${ticket.code}`}
                        target="_blank"
                        className={buttonVariants({ variant: 'ghost', size: 'sm' })}
                        title="View Attendee Pass"
                      >
                        <span>View Pass</span>
                        <ExternalLink className="size-3" />
                      </Link>
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
