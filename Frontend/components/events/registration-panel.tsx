'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import useSWR, { useSWRConfig } from 'swr'
import { toast } from 'sonner'
import { AlertCircle, ArrowRight, Loader2, Lock, Ticket, UserRound } from 'lucide-react'
import { ApiError, CURRENT_USER, getMyTickets, registerForEvent } from '@/lib/api'
import { DEPARTMENTS } from '@/lib/mock-data'
import { cn } from '@/lib/utils'
import type { AttendeeInput, CampusEvent } from '@/lib/types'
import { CapacityGauge, getCapacityState } from '@/components/capacity-gauge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type Errors = Partial<Record<keyof AttendeeInput, string>>

const EMPTY: AttendeeInput = { fullName: '', email: '', studentId: '', department: '' }

function validate(input: AttendeeInput): Errors {
  const errors: Errors = {}
  if (input.fullName.trim().length < 2) errors.fullName = 'Enter your full name'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) errors.email = 'Enter a valid email address'
  if (!/^[A-Za-z0-9]{6,12}$/.test(input.studentId.trim())) errors.studentId = 'Student ID should be 6–12 letters or digits'
  if (!input.department) errors.department = 'Select your department'
  return errors
}

export function RegistrationPanel({ event }: { event: CampusEvent }) {
  const router = useRouter()
  const { mutate } = useSWRConfig()
  const { data: myTickets } = useSWR('my-tickets', getMyTickets)
  const existing = myTickets?.find((t) => t.event.id === event.id)

  const [values, setValues] = useState<AttendeeInput>(EMPTY)
  const [errors, setErrors] = useState<Errors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const state = getCapacityState(event.registered, event.capacity)
  const soldOut = state === 'sold-out'

  function update<K extends keyof AttendeeInput>(key: K, value: AttendeeInput[K]) {
    setValues((v) => ({ ...v, [key]: value }))
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }))
    setFormError(null)
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const nextErrors = validate(values)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setSubmitting(true)
    setFormError(null)
    try {
      const { ticket } = await registerForEvent(event.id, values)
      await Promise.all([
        mutate(['event', event.slug]),
        mutate('events'),
        mutate('my-tickets'),
      ])
      toast.success('Spot reserved', { description: `Your pass was emailed to ${ticket.attendee.email}` })
      router.push(`/registration/success?code=${encodeURIComponent(ticket.code)}`)
    } catch (err) {
      setSubmitting(false)
      if (err instanceof ApiError) {
        setFormError(err.message)
        if (err.code === 'SOLD_OUT') mutate(['event', event.slug])
      } else {
        setFormError('Something went wrong. Please try again.')
      }
    }
  }

  return (
    <section aria-labelledby="register-heading" className="flex flex-col gap-5 rounded-xl border border-border bg-card p-5 sm:p-6">
      <div className="flex flex-col gap-1">
        <h2 id="register-heading" className="text-lg font-semibold">
          {existing ? 'You’re registered' : soldOut ? 'Registration closed' : 'Reserve your spot'}
        </h2>
        <p className="text-sm text-muted-foreground">Free for enrolled students. One pass per student.</p>
      </div>

      <CapacityGauge registered={event.registered} capacity={event.capacity} />

      {existing ? (
        <div className="flex flex-col gap-3 rounded-lg border border-success/30 bg-success/10 p-4">
          <p className="flex items-center gap-2 text-sm font-medium text-emerald-300">
            <Ticket className="size-4" aria-hidden="true" />
            Pass {existing.ticket.code}
          </p>
          <Link href={`/tickets/${existing.ticket.code}`} className={cn(buttonVariants(), 'h-10 w-full')}>
            View my pass
            <ArrowRight aria-hidden="true" />
          </Link>
        </div>
      ) : soldOut ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">All {event.capacity} spots have been claimed.</p>
          <Button disabled className="h-11 w-full bg-danger/15 text-red-300 disabled:opacity-100">
            <Lock aria-hidden="true" />
            Event Sold Out
          </Button>
          <Link href="/events" className="text-center text-sm text-primary hover:underline">
            Browse other events
          </Link>
        </div>
      ) : (
        <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
          <button
            type="button"
            onClick={() => {
              setValues(CURRENT_USER)
              setErrors({})
              setFormError(null)
            }}
            className="flex items-center justify-center gap-2 rounded-md border border-dashed border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
          >
            <UserRound className="size-4" aria-hidden="true" />
            Autofill from campus profile
          </button>

          <FormField id="fullName" label="Full name" error={errors.fullName}>
            <Input
              id="fullName"
              autoComplete="name"
              value={values.fullName}
              onChange={(e) => update('fullName', e.target.value)}
              aria-invalid={!!errors.fullName}
              aria-describedby={errors.fullName ? 'fullName-error' : undefined}
              className="h-10"
            />
          </FormField>

          <FormField id="email" label="Campus email" error={errors.email}>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@campus.edu"
              value={values.email}
              onChange={(e) => update('email', e.target.value)}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'email-error' : undefined}
              className="h-10"
            />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <FormField id="studentId" label="Student ID" error={errors.studentId}>
              <Input
                id="studentId"
                placeholder="22CS1047"
                value={values.studentId}
                onChange={(e) => update('studentId', e.target.value)}
                aria-invalid={!!errors.studentId}
                aria-describedby={errors.studentId ? 'studentId-error' : undefined}
                className="h-10 font-mono uppercase placeholder:normal-case"
              />
            </FormField>

            <FormField id="department" label="Department" error={errors.department}>
              <Select value={values.department} onValueChange={(v) => update('department', v ?? '')}>
                <SelectTrigger
                  id="department"
                  aria-invalid={!!errors.department}
                  aria-describedby={errors.department ? 'department-error' : undefined}
                  className="h-10 w-full"
                >
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>

          {formError && (
            <p role="alert" className="flex items-start gap-2 rounded-md border border-danger/30 bg-danger/10 p-3 text-sm text-red-300">
              <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              {formError}
            </p>
          )}

          <Button type="submit" disabled={submitting} className="h-11 w-full">
            {submitting ? (
              <>
                <Loader2 className="animate-spin" aria-hidden="true" />
                Reserving & signing pass…
              </>
            ) : (
              <>
                Reserve spot
                <ArrowRight aria-hidden="true" />
              </>
            )}
          </Button>
          {state === 'almost-full' && (
            <p className="text-center text-xs text-warning">Only a few spots left — reserve now.</p>
          )}
        </form>
      )}
    </section>
  )
}

function FormField({
  id,
  label,
  error,
  children,
}: {
  id: string
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && (
        <p id={`${id}-error`} className="text-xs text-red-300">
          {error}
        </p>
      )}
    </div>
  )
}
