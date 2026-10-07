import { OrganizerSidebar } from '@/components/organizer/organizer-sidebar'

export const metadata = {
  title: {
    default: 'Organizer Portal',
    template: '%s · Organizer Portal',
  },
}

export default function OrganizerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col lg:flex-row">
      <OrganizerSidebar />
      <div className="flex-1 overflow-x-hidden bg-background/50">
        {children}
      </div>
    </div>
  )
}
