import { DoorOpen, Percent, UserCheck, Users, UserX } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { GateStats } from '@/lib/types'
import { cn } from '@/lib/utils'

export function GateHeader({ stats }: { stats: GateStats | undefined }) {
  const kpis: { label: string; value: string; icon: LucideIcon; accent: string }[] = [
    { label: 'Total Registered', value: fmt(stats?.totalRegistered), icon: Users, accent: 'text-info' },
    { label: 'Checked-In', value: fmt(stats?.checkedIn), icon: UserCheck, accent: 'text-success' },
    { label: 'Remaining', value: fmt(stats?.remaining), icon: UserX, accent: 'text-warning' },
    {
      label: 'Attendance',
      value: stats ? `${stats.attendancePct.toFixed(1)}%` : '—',
      icon: Percent,
      accent: 'text-primary',
    },
  ]

  return (
    <header className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-md border border-success/30 bg-success/10 px-2.5 py-1 font-mono text-xs font-medium text-emerald-300">
              <span className="relative flex size-2" aria-hidden="true">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60 motion-reduce:animate-none" />
                <span className="relative inline-flex size-2 rounded-full bg-success" />
              </span>
              <DoorOpen className="size-3.5" aria-hidden="true" />
              {stats?.gate ?? 'Gate #1'} · LIVE
            </span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Organizer Scanner</h1>
          <p className="text-sm text-muted-foreground">
            Verifying passes for <span className="text-foreground">{stats?.eventTitle ?? '…'}</span>
          </p>
        </div>
      </div>

      <dl className="grid grid-cols-2 overflow-hidden rounded-xl border border-border bg-card md:grid-cols-4">
        {kpis.map((kpi, i) => (
          <div
            key={kpi.label}
            className={cn(
              'flex flex-col gap-1.5 p-4',
              i % 2 === 1 && 'border-l border-border',
              i >= 2 && 'border-t border-border md:border-t-0',
              i === 2 && 'md:border-l',
            )}
          >
            <dt className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground">
              <kpi.icon className={cn('size-3.5', kpi.accent)} aria-hidden="true" />
              {kpi.label}
            </dt>
            <dd className="font-mono text-2xl font-semibold tabular-nums" aria-live="polite">
              {kpi.value}
            </dd>
          </div>
        ))}
      </dl>
      {stats && (
        <div
          className="-mt-3 h-1 overflow-hidden rounded-full bg-secondary"
          role="progressbar"
          aria-label="Attendance"
          aria-valuenow={Math.round(stats.attendancePct)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className="h-full bg-success transition-[width] duration-500" style={{ width: `${stats.attendancePct}%` }} />
        </div>
      )}
    </header>
  )
}

function fmt(n: number | undefined) {
  return n === undefined ? '—' : n.toLocaleString('en-IN')
}
