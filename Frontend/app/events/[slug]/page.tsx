import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { EventDetail } from '@/components/events/event-detail'
import { getEventSync } from '@/lib/api'
import { EVENTS } from '@/lib/mock-data'

export function generateStaticParams() {
  return EVENTS.map((e) => ({ slug: e.slug }))
}

export async function generateMetadata({ params }: PageProps<'/events/[slug]'>): Promise<Metadata> {
  const { slug } = await params
  const event = getEventSync(slug)
  if (!event) return { title: 'Event not found' }
  return { title: event.title, description: event.tagline }
}

export default async function EventPage({ params }: PageProps<'/events/[slug]'>) {
  const { slug } = await params
  const event = getEventSync(slug)
  if (!event) notFound()

  return <EventDetail initialEvent={event} />
}
