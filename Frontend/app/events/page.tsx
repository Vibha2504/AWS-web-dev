import type { Metadata } from 'next'
import { EventsDirectory } from '@/components/events/events-directory'
import { getEventsSync } from '@/lib/api'

export const metadata: Metadata = {
  title: 'Events',
  description: 'Browse upcoming hackathons, bootcamps, conferences, and security labs on campus.',
}

export default function EventsPage() {
  const events = getEventsSync()

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 md:py-14">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Upcoming events</h1>
        <p className="text-muted-foreground">
          Reserve a spot and your signed QR pass lands in your inbox instantly.
        </p>
      </header>
      <EventsDirectory initialEvents={events} />
    </main>
  )
}
