'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { CircleCheck, Loader2, ScanQrCode, ShieldAlert, TriangleAlert, X } from 'lucide-react'
import { formatClock, relativeTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Attendee } from '@/lib/types'
import type { ScanOutcome } from '@/components/scanner/scanner-portal'

interface VerificationHudProps {
  outcome: ScanOutcome | null
  pending: boolean
  now: number
  onDismiss: () => void
}

export function VerificationHud({ outcome, pending, now, onDismiss }: VerificationHudProps) {
  return (
    <section aria-label="Verification result" aria-live="assertive" className="relative min-h-80">
      <AnimatePresence mode="wait" initial={false}>
        {pending ? (
          <Frame key="pending" className="border-info/30">
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
              <Loader2 className="size-8 animate-spin text-info" aria-hidden="true" />
              <p className="font-mono text-sm uppercase tracking-widest text-muted-foreground">Verifying signature…</p>
            </div>
          </Frame>
        ) : !outcome ? (
          <Frame key="idle">
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
              <ScanQrCode className="size-10 text-slate-600" aria-hidden="true" />
              <p className="font-medium">Awaiting scan</p>
              <p className="max-w-xs text-sm text-muted-foreground">
                Results appear here the moment a pass is scanned, entered manually, or a demo test runs.
              </p>
            </div>
          </Frame>
        ) : (
          <ResultCard key={outcome.id} outcome={outcome} now={now} onDismiss={onDismiss} />
        )}
      </AnimatePresence>
    </section>
  )
}

function ResultCard({ outcome, now, onDismiss }: { outcome: ScanOutcome; now: number; onDismiss: () => void }) {
  const { result } = outcome

  if (result.status === 'CHECKED_IN') {
    return (
      <Frame className="border-success/40 shadow-[0_0_60px_-12px_rgb(16_185_129/0.45)]" onDismiss={onDismiss}>
        <StatusBadge tone="success" icon={CircleCheck} label="Checked-In" />
        <h2 className="text-2xl font-semibold tracking-tight">{result.attendee.name}</h2>
        <p className="-mt-3 text-sm text-muted-foreground">Access granted · {result.attendee.eventTitle}</p>
        <AttendeeGrid
          attendee={result.attendee}
          extra={{ label: 'Checked in', value: relativeTime(result.checkedInAt, now), hint: formatClock(result.checkedInAt) }}
        />
      </Frame>
    )
  }

  if (result.status === 'ALREADY_USED') {
    return (
      <Frame className="border-warning/40 shadow-[0_0_60px_-12px_rgb(245_158_11/0.4)]" onDismiss={onDismiss}>
        <StatusBadge tone="warning" icon={TriangleAlert} label="Already Used" />
        <h2 className="text-2xl font-semibold tracking-tight text-amber-200">Duplicate Entry Alert!</h2>
        <p className="-mt-3 text-sm text-muted-foreground">
          This pass was already admitted. Do not allow re-entry without supervisor approval.
        </p>
        <AttendeeGrid
          attendee={result.attendee}
          extra={{
            label: 'Original check-in',
            value: `Checked in ${relativeTime(result.originalCheckInTime, now).toLowerCase()}`,
            hint: formatClock(result.originalCheckInTime),
          }}
        />
      </Frame>
    )
  }

  return (
    <Frame className="border-danger/40 shadow-[0_0_60px_-12px_rgb(244_63_94/0.45)]" onDismiss={onDismiss}>
      <StatusBadge tone="danger" icon={ShieldAlert} label="Invalid Ticket" />
      <h2 className="text-2xl font-semibold tracking-tight text-rose-200">Invalid / Tampered Ticket</h2>
      <div role="alert" className="flex flex-col gap-1 rounded-lg border border-danger/30 bg-danger/10 p-4">
        <p className="font-mono text-xs uppercase tracking-widest text-rose-300">Verification failed</p>
        <p className="font-medium">{result.reason}</p>
      </div>
      <p className="text-sm text-muted-foreground">
        The pass signature does not match the CampusPass registry. Deny entry and direct the holder to the help desk.
      </p>
      <p className="mt-auto font-mono text-xs text-muted-foreground">Scanned at {formatClock(outcome.scannedAt)}</p>
    </Frame>
  )
}

function Frame({
  children,
  className,
  onDismiss,
}: {
  children: React.ReactNode
  className?: string
  onDismiss?: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.18 }}
      className={cn('relative flex h-full min-h-80 flex-col gap-5 rounded-xl border border-border bg-card p-5 sm:p-6', className)}
    >
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="absolute top-4 right-4 rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          <X className="size-4" aria-hidden="true" />
          <span className="sr-only">Clear result</span>
        </button>
      )}
      {children}
    </motion.div>
  )
}

const TONES = {
  success: 'border-success/40 bg-success/15 text-emerald-300',
  warning: 'border-warning/40 bg-warning/15 text-amber-300',
  danger: 'border-danger/40 bg-danger/15 text-rose-300',
}

function StatusBadge({
  tone,
  icon: Icon,
  label,
}: {
  tone: keyof typeof TONES
  icon: React.ComponentType<{ className?: string }>
  label: string
}) {
  return (
    <span
      className={cn(
        'inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1 font-mono text-xs font-semibold uppercase tracking-widest',
        TONES[tone],
      )}
    >
      <Icon className="size-4" aria-hidden="true" />
      {label}
    </span>
  )
}

function AttendeeGrid({
  attendee,
  extra,
}: {
  attendee: Attendee
  extra: { label: string; value: string; hint: string }
}) {
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-4 border-t border-border pt-5 text-sm">
      <Item label="Student ID" value={attendee.studentId} mono />
      <Item label="Department" value={attendee.department} />
      <Item label="Seat" value={attendee.seat} />
      <Item label="Ticket" value={attendee.ticketCode} mono />
      <div className="col-span-2 flex flex-col gap-1">
        <dt className="text-xs uppercase tracking-wider text-muted-foreground">{extra.label}</dt>
        <dd className="text-lg font-semibold">
          {extra.value} <span className="font-mono text-sm font-normal text-muted-foreground">· {extra.hint}</span>
        </dd>
      </div>
    </dl>
  )
}

function Item({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <dt className="text-xs uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className={cn('truncate font-medium', mono && 'font-mono')}>{value}</dd>
    </div>
  )
}
