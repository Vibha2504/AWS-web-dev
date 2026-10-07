import type { Metadata } from 'next'
import { TicketView } from '@/components/tickets/ticket-view'

export const metadata: Metadata = {
  title: 'Your pass',
  robots: { index: false },
}

export default async function TicketPage({ params }: PageProps<'/tickets/[code]'>) {
  const { code } = await params

  return <TicketView code={decodeURIComponent(code)} isNew={false} />
}
