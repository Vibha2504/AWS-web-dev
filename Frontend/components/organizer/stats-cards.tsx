'use client'

import { CalendarDays, CheckCircle2, Clock, Percent, Users } from 'lucide-react'
import type { OrganizerStats } from '@/lib/types'

interface StatsCardsProps {
  stats?: OrganizerStats
}

export function StatsCards({ stats }: StatsCardsProps) {
  const items = [
    {
      label: 'Total Events',
      value: stats ? stats.totalEvents : '—',
      subtext: 'Campus events hosted',
      icon: CalendarDays,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10 border-indigo-500/20',
    },
    {
      label: 'Registrations',
      value: stats ? stats.totalRegistrations.toLocaleString() : '—',
      subtext: 'Total passes issued',
      icon: Users,
      color: 'text-sky-400',
      bg: 'bg-sky-500/10 border-sky-500/20',
    },
    {
      label: 'Checked In',
      value: stats ? stats.totalCheckedIn.toLocaleString() : '—',
      subtext: 'Verified at gates',
      icon: CheckCircle2,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20',
    },
    {
      label: 'Pending Entry',
      value: stats ? stats.remainingAttendees.toLocaleString() : '—',
      subtext: 'Expected arrivals',
      icon: Clock,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/20',
    },
    {
      label: 'Attendance Rate',
      value: stats ? `${stats.attendancePct}%` : '—',
      subtext: 'Live conversion',
      icon: Percent,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10 border-purple-500/20',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-5">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex flex-col justify-between rounded-xl border border-border bg-card p-4 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">{item.label}</span>
            <div className={`flex size-7 items-center justify-center rounded-lg border ${item.bg}`}>
              <item.icon className={`size-3.5 ${item.color}`} />
            </div>
          </div>
          <div className="mt-3">
            <div className="font-mono text-2xl font-bold tracking-tight text-foreground">{item.value}</div>
            <div className="text-[11px] text-muted-foreground">{item.subtext}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
