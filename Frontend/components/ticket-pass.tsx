'use client'

import { QRCodeSVG } from 'qrcode.react'
import { ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatEventDate, formatTime } from '@/lib/format'
import { buildQrPayload } from '@/lib/signing'
import type { CampusEvent, Ticket } from '@/lib/types'
import { CategoryBadge } from '@/components/category-badge'

interface TicketPassProps {
  ticket: Ticket
  event: CampusEvent
  className?: string
  compact?: boolean
}

export function TicketPass({ ticket, event, className, compact = false }: TicketPassProps) {
  const payload = buildQrPayload(ticket.code, ticket.signature)

  return (
    <article
      aria-label={`Ticket ${ticket.code} for ${event.title}`}
      className={cn(
        'relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card md:flex-row',
        className,
      )}
    >
      <div className="flex flex-1 flex-col gap-5 p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">
              <span className="font-mono">CampusPass</span>
              <span aria-hidden="true">·</span>
              <span>Admit One</span>
            </div>
            <h3 className="text-pretty text-lg font-semibold leading-tight sm:text-xl">{event.title}</h3>
          </div>
          <CategoryBadge category={event.category} />
        </div>

        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
          <Field label="Attendee" value={ticket.attendee.fullName} />
          <Field label="Student ID" value={ticket.attendee.studentId} mono />
          <Field label="Department" value={ticket.attendee.department} />
          <Field label="Seat" value={ticket.seat} />
          <Field label="Date" value={formatEventDate(event.startsAt)} />
          <Field label="Doors" value={formatTime(event.startsAt)} />
          {!compact && <Field label="Venue" value={event.venue} className="col-span-2" />}
        </dl>
      </div>

      <div
        aria-hidden="true"
        className="relative mx-5 border-t border-dashed border-border md:mx-0 md:my-5 md:border-t-0 md:border-l"
      >
        <span className="absolute -top-3 -left-8 size-6 rounded-full border border-border bg-background md:-top-8 md:-left-3" />
        <span className="absolute -top-3 -right-8 size-6 rounded-full border border-border bg-background md:top-auto md:-bottom-8 md:-left-3 md:right-auto" />
      </div>

      <div className="flex flex-col items-center justify-center gap-3 p-5 sm:p-6 md:w-60">
        <div className="rounded-xl bg-white p-3">
          <QRCodeSVG
            value={payload}
            size={compact ? 120 : 152}
            level="M"
            bgColor="#ffffff"
            fgColor="#090D16"
            title={`QR code for ticket ${ticket.code}`}
          />
        </div>
        <p className="font-mono text-sm font-semibold tracking-wider">{ticket.code}</p>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="size-3.5 text-success" aria-hidden="true" />
          Signed · {ticket.signature.slice(0, 8)}
        </p>
      </div>
    </article>
  )
}

function Field({
  label,
  value,
  mono,
  className,
}: {
  label: string
  value: string
  mono?: boolean
  className?: string
}) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-1', className)}>
      <dt className="text-xs uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className={cn('truncate font-medium', mono && 'font-mono')}>{value}</dd>
    </div>
  )
}
