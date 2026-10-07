import Link from 'next/link'
import { Activity, ScanLine, ShieldAlert, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'

const FEATURES = [
  { icon: ScanLine, label: 'Camera & manual verification' },
  { icon: ShieldAlert, label: 'Duplicate & tamper detection' },
  { icon: Users, label: 'Live attendance metrics' },
  { icon: Activity, label: 'Full scan audit log' },
]

export function OrganizerCallout() {
  return (
    <section aria-labelledby="organizer-heading">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="flex flex-col gap-8 rounded-2xl border border-border bg-card p-6 sm:p-10 md:flex-row md:items-center md:justify-between">
          <div className="flex max-w-md flex-col gap-3">
            <h2 id="organizer-heading" className="text-balance text-2xl font-semibold tracking-tight">
              Running the gate? Turn any device into a scanner.
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Verify signed passes in under a second, see who&apos;s already inside, and keep a record of every scan.
            </p>
            <Link href="/organizer/scan" className={cn(buttonVariants(), 'mt-2 h-10 w-fit px-4')}>
              <ScanLine aria-hidden="true" />
              Launch scanner
            </Link>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {FEATURES.map((f) => (
              <li key={f.label} className="flex items-center gap-3 rounded-lg border border-border bg-background px-4 py-3 text-sm">
                <f.icon className="size-4 text-primary" aria-hidden="true" />
                {f.label}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
