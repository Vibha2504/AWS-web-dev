export type EventCategory = 'Hackathons' | 'Bootcamps' | 'Conferences' | 'Security Labs'

export interface ScheduleItem {
  time: string
  title: string
  description?: string
}

export interface CampusEvent {
  id: string
  slug: string
  code: string
  title: string
  tagline: string
  description: string
  category: EventCategory
  startsAt: string
  endsAt: string
  venue: string
  venueDetails: string
  address: string
  organizer: string
  coverImage: string
  capacity: number
  registered: number
  schedule: ScheduleItem[]
  highlights: string[]
}

export interface AttendeeInput {
  fullName: string
  email: string
  studentId: string
  department: string
}

export interface Ticket {
  code: string
  eventId: string
  attendee: AttendeeInput
  seat: string
  issuedAt: string
  checkedInAt: string | null
  signature: string
  emailDispatched: boolean
  ownedByCurrentUser: boolean
}

export interface Attendee {
  name: string
  studentId: string
  email: string
  department: string
  ticketCode: string
  seat: string
  eventId: string
  eventTitle: string
}

export type VerificationResult =
  | {
      status: 'CHECKED_IN'
      message: 'Ticket verified'
      attendee: Attendee
      checkedInAt: string
    }
  | {
      status: 'ALREADY_USED'
      message: 'Ticket already used'
      attendee: Attendee
      originalCheckInTime: string
    }
  | {
      status: 'INVALID_TICKET'
      reason: string
    }

export type VerificationStatus = VerificationResult['status']

export interface AuditLogEntry {
  id: string
  scannedAt: string
  status: VerificationStatus
  ticketCode: string
  attendeeName: string | null
  gate: string
  method: 'camera' | 'manual' | 'demo'
}

export interface GateStats {
  eventId: string
  eventTitle: string
  gate: string
  totalRegistered: number
  checkedIn: number
  remaining: number
  attendancePct: number
}

export interface RegistrationResponse {
  ticket: Ticket
  event: CampusEvent
}

export interface OrganizerStats {
  totalEvents: number
  totalRegistrations: number
  totalCheckedIn: number
  remainingAttendees: number
  attendancePct: number
}

export interface CreateEventInput {
  title: string
  tagline: string
  description: string
  category: EventCategory
  startsAt: string
  endsAt: string
  venue: string
  venueDetails?: string
  address?: string
  organizer: string
  coverImage?: string
  capacity: number
}

export interface EventRegistrationRecord {
  ticket: Ticket
  event: CampusEvent
}

