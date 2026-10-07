'use client'

import { useState } from 'react'
import useSWR from 'swr'
import {
  AlertTriangle,
  CheckCircle2,
  Filter,
  History,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  XCircle,
} from 'lucide-react'
import { getAuditLog, getCheckInHistory } from '@/lib/api'
import { Input } from '@/components/ui/input'
import { buttonVariants } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import type { VerificationStatus } from '@/lib/types'

export default function CheckInHistoryPage() {
  const [statusFilter, setStatusFilter] = useState<'ALL' | VerificationStatus>('ALL')
  const [search, setSearch] = useState('')

  const { data: logs, mutate, isLoading } = useSWR(
    ['organizer-checkins', statusFilter, search],
    () => getCheckInHistory({ status: statusFilter, search }),
    { refreshInterval: 10_000 },
  )

  const handleRefresh = async () => {
    await mutate()
    toast.info('Audit feed updated with latest gate scans')
  }

  // Summary counts
  const total = logs?.length || 0
  const validCount = logs?.filter((l) => l.status === 'CHECKED_IN').length || 0
  const duplicateCount = logs?.filter((l) => l.status === 'ALREADY_USED').length || 0
  const invalidCount = logs?.filter((l) => l.status === 'INVALID_TICKET').length || 0

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Check-In History & Gate Audit Log
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Immutable chronological stream of every webcam scan, duplicate entry flag, and counterfeit rejection.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          className={buttonVariants({ variant: 'outline', size: 'sm' })}
        >
          <RefreshCw className="size-3.5" />
          <span>Refresh Audit Stream</span>
        </button>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-xs text-muted-foreground font-medium">Total Scans Recorded</div>
          <div className="font-mono text-2xl font-bold text-foreground mt-1">{total}</div>
        </div>
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
          <div className="text-xs text-emerald-400 font-medium flex items-center gap-1.5">
            <CheckCircle2 className="size-3.5" />
            <span>Valid Check-Ins</span>
          </div>
          <div className="font-mono text-2xl font-bold text-emerald-400 mt-1">{validCount}</div>
        </div>
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
          <div className="text-xs text-amber-400 font-medium flex items-center gap-1.5">
            <AlertTriangle className="size-3.5" />
            <span>Duplicate Scans Flagged</span>
          </div>
          <div className="font-mono text-2xl font-bold text-amber-400 mt-1">{duplicateCount}</div>
        </div>
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4">
          <div className="text-xs text-rose-400 font-medium flex items-center gap-1.5">
            <XCircle className="size-3.5" />
            <span>Counterfeits Rejected</span>
          </div>
          <div className="font-mono text-2xl font-bold text-rose-400 mt-1">{invalidCount}</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search attendee, ticket ID..."
            className="pl-9 h-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(
            [
              { id: 'ALL', label: 'All Scan Outcomes' },
              { id: 'CHECKED_IN', label: '🟢 Checked-In' },
              { id: 'ALREADY_USED', label: '🟡 Duplicate Flags' },
              { id: 'INVALID_TICKET', label: '🔴 Invalid / Tampered' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as 'ALL' | VerificationStatus)}
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

      {/* Audit Log Table */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/40 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="py-3 px-4 sm:px-6">Timestamp</th>
                <th className="py-3 px-4">Verification Result</th>
                <th className="py-3 px-4">Attendee Name</th>
                <th className="py-3 px-4">Ticket Token / Code</th>
                <th className="py-3 px-4">Gate Station</th>
                <th className="py-3 px-4 sm:px-6 text-right">Detection Method</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoading && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
                    Querying cryptographic audit stream...
                  </td>
                </tr>
              )}
              {logs?.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
                    No scan entries recorded yet under this filter.
                  </td>
                </tr>
              )}
              {logs?.map((entry) => {
                const isValid = entry.status === 'CHECKED_IN'
                const isDuplicate = entry.status === 'ALREADY_USED'
                const isInvalid = entry.status === 'INVALID_TICKET'

                return (
                  <tr key={entry.id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap font-mono text-xs text-muted-foreground">
                      {formatTime(entry.scannedAt)}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {isValid && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/25">
                          <CheckCircle2 className="size-3" />
                          CHECKED IN
                        </span>
                      )}
                      {isDuplicate && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold text-amber-400 border border-amber-500/25">
                          <AlertTriangle className="size-3" />
                          ALREADY USED
                        </span>
                      )}
                      {isInvalid && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-2.5 py-0.5 text-xs font-semibold text-rose-400 border border-rose-500/25">
                          <XCircle className="size-3" />
                          INVALID TICKET
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-medium text-foreground text-xs sm:text-sm">
                        {entry.attendeeName || 'Unknown / Unrecognized'}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-mono text-xs font-semibold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                        {entry.ticketCode}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-xs text-muted-foreground">
                      {entry.gate}
                    </td>

                    <td className="py-3.5 px-4 sm:px-6 text-right whitespace-nowrap">
                      <span className="capitalize text-xs font-mono text-muted-foreground bg-secondary px-2 py-0.5 rounded">
                        {entry.method}
                      </span>
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
