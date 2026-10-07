import { Compass, ScanLine, Ticket } from 'lucide-react'

const STEPS = [
  {
    icon: Compass,
    title: 'Browse',
    body: 'Explore hackathons, bootcamps, conferences, and security labs with live seat counts.',
  },
  {
    icon: Ticket,
    title: 'Reserve',
    body: 'Claim a seat with your student details. A signed QR pass lands in your inbox instantly.',
  },
  {
    icon: ScanLine,
    title: 'Scan & Enter',
    body: 'Organizers verify the signature instantly. Every pass works once — no duplicates.',
  },
]

export function HowItWorks() {
  return (
    <section aria-labelledby="how-heading" className="border-b border-border">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 id="how-heading" className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
          How it works
        </h2>
        <ol className="mt-8 grid gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-3">
          {STEPS.map((step, i) => (
            <li key={step.title} className="flex flex-col gap-4 bg-background p-6">
              <div className="flex items-center justify-between">
                <span className="inline-flex size-10 items-center justify-center rounded-lg border border-border bg-card">
                  <step.icon className="size-5 text-primary" aria-hidden="true" />
                </span>
                <span className="font-mono text-xs text-muted-foreground">0{i + 1}</span>
              </div>
              <h3 className="font-semibold">{step.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
