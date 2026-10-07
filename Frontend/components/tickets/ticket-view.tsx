'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import useSWR from 'swr'
import { motion } from 'framer-motion'
import { QRCodeCanvas } from 'qrcode.react'
import { toast } from 'sonner'
import { ArrowLeft, CheckCircle2, Download, Mail, MailCheck, ScanLine, TicketX } from 'lucide-react'
import { getQrPayload, getTicket } from '@/lib/api'
import { downloadPass } from '@/lib/download-pass'
import { formatClock, formatEventDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Button, buttonVariants } from '@/components/ui/button'
import { TicketPass } from '@/components/ticket-pass'
import { EmailPreviewDialog } from '@/components/tickets/email-preview-dialog'

export function TicketView({ code, isNew }: { code: string; isNew: boolean }) {
  const { data, isLoading } = useSWR(code ? ['ticket', code] : null, () => getTicket(code))
  const [emailOpen, setEmailOpen] = useState(false)
  const qrRef = useRef<HTMLCanvasElement>(null)

  if (isLoading) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6" aria-busy="true">
        <div className="h-6 w-40 animate-pulse rounded bg-secondary" />
        <div className="mt-8 h-80 animate-pulse rounded-2xl bg-card" />
      </main>
    )
  }

  if (!data) {
    return (
      <main className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
        <TicketX className="size-10 text-muted-foreground" aria-hidden="true" />
        <h1 className="text-xl font-semibold">Pass not found</h1>
        <p className="text-sm text-muted-foreground">
          {code ? (
            <>
              We couldn&apos;t find a pass with code <span className="font-mono">{code}</span>.
            </>
          ) : (
            'No ticket code was provided.'
          )}
        </p>
        <Link href="/tickets" className={cn(buttonVariants({ variant: 'outline' }), 'h-10 px-4')}>
          Go to my tickets
        </Link>
      </main>
    )
  }

  const { ticket, event } = data

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-10 sm:px-6">
      {!isNew && (
        <Link href="/tickets" className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" aria-hidden="true" />
          My tickets
        </Link>
      )}

      {isNew ? (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          role="status"
          className="flex items-start gap-3 rounded-xl border border-success/30 bg-success/10 p-4 sm:p-5"
        >
          <CheckCircle2 className="mt-0.5 size-6 shrink-0 text-success" aria-hidden="true" />
          <div className="flex flex-col gap-1">
            <h1 className="text-xl font-semibold tracking-tight">You&apos;re registered!</h1>
            <p className="text-sm text-muted-foreground">
              Your spot for <span className="text-foreground">{event.title}</span> is confirmed. Show this QR code at
              the entrance — it can only be scanned once.
            </p>
          </div>
        </motion.div>
      ) : (
        <header className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Your event pass</h1>
          <p className="text-sm text-muted-foreground">
            Issued {formatEventDate(ticket.issuedAt)} at {formatClock(ticket.issuedAt)}
          </p>
        </header>
      )}

      <motion.div
        initial={isNew ? { opacity: 0, y: 12 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
      >
        <TicketPass ticket={ticket} event={event} />
      </motion.div>

      {ticket.checkedInAt && (
        <p className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 p-4 text-sm">
          <CheckCircle2 className="size-4 text-success" aria-hidden="true" />
          Checked in at <span className="font-medium">{formatClock(ticket.checkedInAt)}</span> — this pass can&apos;t be
          reused.
        </p>
      )}

      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <MailCheck className="mt-0.5 size-5 shrink-0 text-info" aria-hidden="true" />
          <div className="flex min-w-0 flex-col gap-1">
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-xs font-medium text-emerald-300">
              <span className="size-1.5 rounded-full bg-success" aria-hidden="true" />
              Email Dispatched
            </span>
            <p className="truncate text-sm text-muted-foreground">Sent to {ticket.attendee.email}</p>
          </div>
        </div>
        <Button variant="outline" className="h-9 shrink-0 px-3" onClick={() => setEmailOpen(true)}>
          <Mail aria-hidden="true" />
          Preview Dispatched Email
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          className="h-11 px-5"
          onClick={async () => {
            if (!qrRef.current) return
            await downloadPass(qrRef.current, ticket, event)
            toast.success('Pass downloaded', { description: `${ticket.code}.png` })
          }}
        >
          <Download aria-hidden="true" />
          Download Ticket Pass
        </Button>
        <Link href="/organizer/scan" className={cn(buttonVariants({ variant: 'outline' }), 'h-11 px-5')}>
          <ScanLine aria-hidden="true" />
          Go to Organizer Scanner
        </Link>
      </div>

      <QRCodeCanvas ref={qrRef} value={getQrPayload(ticket)} size={480} level="M" marginSize={0} className="hidden" aria-hidden="true" />
      <EmailPreviewDialog open={emailOpen} onOpenChange={setEmailOpen} ticket={ticket} event={event} />
    </main>
  )
}
