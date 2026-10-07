import { HomeHero } from '@/components/home/home-hero'
import { HowItWorks } from '@/components/home/how-it-works'
import { FeaturedEvents } from '@/components/home/featured-events'
import { OrganizerCallout } from '@/components/home/organizer-callout'
import { getEventsSync } from '@/lib/api'

export default function HomePage() {
  const events = getEventsSync()

  return (
    <main>
      <HomeHero />
      <HowItWorks />
      <FeaturedEvents events={events.slice(0, 3)} />
      <OrganizerCallout />
    </main>
  )
}
