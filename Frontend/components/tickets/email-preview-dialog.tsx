'use client'

import { QRCodeSVG } from 'qrcode.react'
import { getQrPayload } from '@/lib/api'
import { formatClock, formatEventDate, formatTimeRange } from '@/lib/format'
import type { CampusEvent, Ticket } from '@/lib/types'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface EmailPreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ticket: Ticket
  event: CampusEvent
}

export function EmailPreviewDialog({ open, onOpenChange, ticket, event }: EmailPreviewDialogProps) {
  const firstName = ticket.attendee.fullName.split(' ')[0]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] gap-0 overflow-hidden p-0 sm:max-w-xl">
        <DialogHeader className="border-b border-border p-5">
          <DialogTitle>Dispatched email</DialogTitle>
          <DialogDescription>Exactly what the automated mailer delivered to the attendee.</DialogDescription>
        </DialogHeader>

        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 border-b border-border bg-background/60 px-5 py-4 text-sm">
          <dt className="text-muted-foreground">From</dt>
          <dd className="truncate">CampusPass Tickets &lt;tickets@campuspass.edu&gt;</dd>
          <dt className="text-muted-foreground">To</dt>
          <dd className="truncate">
            {ticket.attendee.fullName} &lt;{ticket.attendee.email}&gt;
          </dd>
          <dt className="text-muted-foreground">Subject</dt>
          <dd className="truncate font-medium">Your pass for {event.title} · {ticket.code}</dd>
          <dt className="text-muted-foreground">Sent</dt>
          <dd>
            {formatEventDate(ticket.issuedAt)}, {formatClock(ticket.issuedAt)}
          </dd>
        </dl>

        <div className="overflow-y-auto bg-slate-100 p-4 sm:p-6">
          <div className="mx-auto max-w-md overflow-hidden rounded-lg bg-white text-slate-800 shadow-sm">
            <div className="bg-[#0F172A] px-6 py-5">
              <p className="font-mono text-xs tracking-widest text-slate-400">CAMPUSPASS</p>
              <p className="mt-1 text-lg font-semibold text-white">You&apos;re registered!</p>
            </div>
            <div className="flex flex-col gap-4 px-6 py-5 text-sm leading-relaxed">
              <p>Hi {firstName},</p>
              <p>
                Your spot for <strong>{event.title}</strong> is confirmed. Present the QR code below at the entrance —
                it&apos;s signed and valid for a single check-in.
              </p>
              <div className="flex flex-col items-center gap-2 rounded-md border border-slate-200 py-5">
                <QRCodeSVG value={getQrPayload(ticket)} size={140} level="M" fgColor="#090D16" />
                <p className="font-mono text-sm font-bold tracking-wider">{ticket.code}</p>
              </div>
              <table className="w-full text-left text-sm">
                <tbody className="[&_td]:py-1 [&_th]:py-1 [&_th]:pr-4 [&_th]:font-normal [&_th]:text-slate-500">
                  <tr>
                    <th scope="row">Date</th>
                    <td>{formatEventDate(event.startsAt)}</td>
                  </tr>
                  <tr>
                    <th scope="row">Time</th>
                    <td>{formatTimeRange(event.startsAt, event.endsAt)}</td>
                  </tr>
                  <tr>
                    <th scope="row">Venue</th>
                    <td>{event.venue}</td>
                  </tr>
                  <tr>
                    <th scope="row">Seat</th>
                    <td>{ticket.seat}</td>
                  </tr>
                </tbody>
              </table>
              <p className="text-xs text-slate-500">
                Don&apos;t share this email — anyone holding the QR code can use your pass. Questions? Reply to reach{' '}
                {event.organizer}.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
