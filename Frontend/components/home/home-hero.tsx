import Link from 'next/link'
import { ArrowRight, MailCheck, ScanLine, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { TicketPass } from '@/components/ticket-pass'
import { EVENTS } from '@/lib/mock-data'
import { signTicket } from '@/lib/signing'
import type { Ticket } from '@/lib/types'

const SAMPLE_EVENT = EVENTS[0]
const SAMPLE_TICKET: Ticket = {
  code: 'TKT-HACK-84920',
  eventId: SAMPLE_EVENT.id,
  attendee: {
    fullName: 'Aarav Sharma',
    email: 'aarav.sharma@campus.edu',
    studentId: '22CS1047',
    department: 'Computer Science',
  },
  seat: 'Table 14',
  issuedAt: '2026-10-02T18:24:00+05:30',
  checkedInAt: null,
  signature: signTicket('TKT-HACK-84920'),
  emailDispatched: true,
  ownedByCurrentUser: true,
}

export function HomeHero() {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div aria-hidden="true" className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 md:py-24 lg:grid-cols-[1fr_1.05fr]">
        <div className="flex flex-col gap-6">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
            <span className="size-1.5 rounded-full bg-success" aria-hidden="true" />
            Gate #1 is live for HackSprint 2026
          </span>
          <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
            Discover events. Reserve your spot. Check in instantly.
          </h1>
          <p className="max-w-lg text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
            Reserve a spot in seconds, get a cryptographically signed pass straight to your inbox, and walk in with
            a single QR scan. No paper lists, no double entries.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/events" className={cn(buttonVariants({ size: 'lg' }), 'h-11 px-5')}>
              Browse events
              <ArrowRight aria-hidden="true" />
            </Link>
            <Link
              href="/organizer/scan"
              className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'h-11 px-5')}
            >
              <ScanLine aria-hidden="true" />
              Organizer scanner
            </Link>
          </div>
          <ul className="flex flex-wrap gap-x-6 gap-y-2 pt-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <MailCheck className="size-4 text-info" aria-hidden="true" />
              Automated ticket mailer
            </li>
            <li className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-success" aria-hidden="true" />
              Signed, tamper-proof QR
            </li>
          </ul>
        </div>

        <div className="relative">
          <div aria-hidden="true" className="absolute -inset-8 rounded-full bg-primary/15 blur-3xl" />
          <TicketPass ticket={SAMPLE_TICKET} event={SAMPLE_EVENT} className="relative shadow-2xl shadow-black/40" />
        </div>
      </div>
    </section>
  )
}
