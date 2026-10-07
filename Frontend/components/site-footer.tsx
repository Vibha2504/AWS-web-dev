import Link from 'next/link'
import { Logo } from '@/components/logo'

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-2">
          <Logo className="size-6" />
          <span>CampusPass · Event ticketing with automated mailer &amp; QR check-in</span>
        </div>
        <nav aria-label="Footer" className="flex gap-5">
          <Link href="/events" className="hover:text-foreground">Events</Link>
          <Link href="/tickets" className="hover:text-foreground">My Tickets</Link>
          <Link href="/organizer/scan" className="hover:text-foreground">Organizer</Link>
        </nav>
      </div>
    </footer>
  )
}
