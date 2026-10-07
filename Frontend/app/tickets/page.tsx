import type { Metadata } from 'next'
import { MyTickets } from '@/components/tickets/my-tickets'

export const metadata: Metadata = {
  title: 'My tickets',
  description: 'All your signed event passes in one place.',
}

export default function TicketsPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 md:py-14">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">My tickets</h1>
        <p className="text-muted-foreground">Signed passes for every event you&apos;ve reserved.</p>
      </header>
      <MyTickets />
    </main>
  )
}
