import type { Metadata } from 'next'
import { TicketView } from '@/components/tickets/ticket-view'

export const metadata: Metadata = {
  title: 'You’re registered',
  robots: { index: false },
}

export default async function RegistrationSuccessPage({ searchParams }: PageProps<'/registration/success'>) {
  const { code } = await searchParams
  const ticketCode = typeof code === 'string' ? code : ''

  return <TicketView code={ticketCode} isNew />
}
