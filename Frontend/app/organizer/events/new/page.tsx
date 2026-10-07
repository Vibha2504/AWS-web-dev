'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Check, Sparkles, UploadCloud, Calendar, Clock, MapPin, Users, Mail } from 'lucide-react'
import { createOrganizerEvent } from '@/lib/api'
import { buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import type { EventCategory } from '@/lib/types'

export default function CreateEventPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    title: '',
    tagline: '',
    category: 'Hackathons' as EventCategory,
    description: '',
    date: '2026-11-15',
    startTime: '10:00',
    endTime: '17:00',
    venue: '',
    address: 'Central Campus',
    capacity: 150,
    organizerName: 'University Tech Council',
    organizerEmail: 'tech-council@campus.edu',
  })

  const handleSubmit = async (e: React.FormEvent, isDraft = false) => {
    e.preventDefault()

    if (!form.title.trim()) {
      toast.error('Event Title is required')
      return
    }
    if (!form.venue.trim()) {
      toast.error('Venue location is required')
      return
    }
    if (form.capacity <= 0) {
      toast.error('Capacity must be greater than 0')
      return
    }

    setLoading(true)
    try {
      const startsAt = `${form.date}T${form.startTime}:00+05:30`
      const endsAt = `${form.date}T${form.endTime}:00+05:30`

      await createOrganizerEvent({
        title: form.title,
        tagline: form.tagline || form.title,
        description: form.description || 'Join us for this exciting campus event.',
        category: form.category,
        startsAt,
        endsAt,
        venue: form.venue,
        address: form.address,
        organizer: form.organizerName,
        capacity: Number(form.capacity),
      })

      toast.success(isDraft ? 'Event saved as draft' : 'Event published successfully!')
      router.push('/organizer/events')
    } catch (err) {
      toast.error('Failed to create event.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      {/* Back button & Title */}
      <div className="flex flex-col gap-2">
        <Link
          href="/organizer/events"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors w-fit"
        >
          <ArrowLeft className="size-3.5" />
          <span>Back to Events</span>
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Create Campus Event
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Set venue limits, check-in policies, and automated pass distribution.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={(e) => handleSubmit(e, false)} className="flex flex-col gap-6">
        {/* Section 1: Basic Information */}
        <div className="rounded-xl border border-border bg-card p-5 sm:p-6 shadow-sm flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <Sparkles className="size-4 text-primary" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">
              Event Information
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2 flex flex-col gap-1.5">
              <Label htmlFor="title" className="text-xs">Event Name *</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. AI & Robotics National Symposium 2026"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="tagline" className="text-xs">Tagline / Subtitle</Label>
              <Input
                id="tagline"
                value={form.tagline}
                onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                placeholder="e.g. The premier university robotics expo."
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="category" className="text-xs">Category *</Label>
              <Select
                value={form.category}
                onValueChange={(val) => setForm({ ...form, category: val as EventCategory })}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Hackathons">Hackathons</SelectItem>
                  <SelectItem value="Bootcamps">Bootcamps</SelectItem>
                  <SelectItem value="Conferences">Conferences</SelectItem>
                  <SelectItem value="Security Labs">Security Labs</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="sm:col-span-2 flex flex-col gap-1.5">
              <Label htmlFor="description" className="text-xs">Description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Provide event overview, prerequisites, tracks, and faculty details..."
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* Section 2: Schedule & Venue */}
        <div className="rounded-xl border border-border bg-card p-5 sm:p-6 shadow-sm flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <Calendar className="size-4 text-sky-400" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">
              Schedule & Venue
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="date" className="text-xs">Event Date *</Label>
              <Input
                id="date"
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="startTime" className="text-xs">Start Time *</Label>
              <Input
                id="startTime"
                type="time"
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="endTime" className="text-xs">End Time *</Label>
              <Input
                id="endTime"
                type="time"
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                required
              />
            </div>

            <div className="sm:col-span-2 flex flex-col gap-1.5">
              <Label htmlFor="venue" className="text-xs">Venue Location *</Label>
              <Input
                id="venue"
                value={form.venue}
                onChange={(e) => setForm({ ...form, venue: e.target.value })}
                placeholder="e.g. Auditorium Hall A, Technology Block"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="address" className="text-xs">Campus Zone</Label>
              <Input
                id="address"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="e.g. North Campus"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Capacity & Tickets */}
        <div className="rounded-xl border border-border bg-card p-5 sm:p-6 shadow-sm flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <Users className="size-4 text-emerald-400" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">
              Capacity & Safety Controls
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="capacity" className="text-xs">Maximum Venue Capacity *</Label>
              <Input
                id="capacity"
                type="number"
                min={1}
                max={5000}
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
                required
              />
              <span className="text-[11px] text-muted-foreground">
                Registrations will be rejected with HTTP 409 once this limit is hit.
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="organizerName" className="text-xs">Host Department / Club *</Label>
              <Input
                id="organizerName"
                value={form.organizerName}
                onChange={(e) => setForm({ ...form, organizerName: e.target.value })}
                required
              />
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={(e) => handleSubmit(e, true)}
            disabled={loading}
            className={buttonVariants({ variant: 'outline' })}
          >
            Save Draft
          </button>
          <button
            type="submit"
            disabled={loading}
            className={buttonVariants({ variant: 'default' })}
          >
            {loading ? 'Publishing Event...' : 'Publish Event'}
          </button>
        </div>
      </form>
    </div>
  )
}
