import { Activity } from 'lucide-react'
import { formatClock, relativeTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { AuditLogEntry, VerificationStatus } from '@/lib/types'

const STATUS: Record<VerificationStatus, { label: string; className: string }> = {
  CHECKED_IN: { label: 'Checked-In', className: 'border-success/30 bg-success/10 text-emerald-300' },
  ALREADY_USED: { label: 'Duplicate', className: 'border-warning/30 bg-warning/10 text-amber-300' },
  INVALID_TICKET: { label: 'Invalid', className: 'border-danger/30 bg-danger/10 text-rose-300' },
}

const METHOD: Record<AuditLogEntry['method'], string> = { camera: 'Camera', manual: 'Manual', demo: 'Demo' }

export function AuditLogTable({ entries, now }: { entries: AuditLogEntry[] | undefined; now: number }) {
  return (
    <section aria-labelledby="audit-heading" className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-5">
        <h2 id="audit-heading" className="flex items-center gap-2 text-sm font-semibold">
          <Activity className="size-4 text-info" aria-hidden="true" />
          Live Gate Audit Log
        </h2>
        <span className="font-mono text-xs text-muted-foreground">{entries?.length ?? 0} recent scans</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th scope="col" className="px-4 py-2.5 font-medium sm:px-5">Time</th>
              <th scope="col" className="px-4 py-2.5 font-medium">Result</th>
              <th scope="col" className="px-4 py-2.5 font-medium">Attendee</th>
              <th scope="col" className="px-4 py-2.5 font-medium">Ticket</th>
              <th scope="col" className="px-4 py-2.5 font-medium">Gate</th>
              <th scope="col" className="px-4 py-2.5 font-medium sm:px-5">Method</th>
            </tr>
          </thead>
          <tbody>
            {!entries
              ? Array.from({ length: 4 }, (_, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    <td colSpan={6} className="px-5 py-3">
                      <div className="h-4 animate-pulse rounded bg-secondary" />
                    </td>
                  </tr>
                ))
              : entries.map((e) => (
                  <tr key={e.id} className="border-b border-border transition-colors last:border-0 hover:bg-secondary/40">
                    <td className="px-4 py-3 whitespace-nowrap sm:px-5">
                      <span className="font-mono">{formatClock(e.scannedAt)}</span>
                      <span className="ml-2 text-xs text-muted-foreground">{relativeTime(e.scannedAt, now)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'inline-flex rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap',
                          STATUS[e.status].className,
                        )}
                      >
                        {STATUS[e.status].label}
                      </span>
                    </td>
                    <td className="px-4 py-3">{e.attendeeName ?? <span className="text-muted-foreground">Unknown</span>}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{e.ticketCode}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{e.gate}</td>
                    <td className="px-4 py-3 text-muted-foreground sm:px-5">{METHOD[e.method]}</td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
