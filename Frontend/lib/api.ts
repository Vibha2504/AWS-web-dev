import {
  CURRENT_USER,
  EVENTS,
  LIVE_GATE,
  createSeedAuditLog,
  createSeedTickets,
} from './mock-data'
import { buildQrPayload, parseToken, signTicket } from './signing'
import type {
  Attendee,
  AttendeeInput,
  AuditLogEntry,
  CampusEvent,
  GateStats,
  RegistrationResponse,
  Ticket,
  VerificationResult,
} from './types'

/*
 * Mock service layer. Every function returns a Promise with the same shape the
 * real backend will return, so swapping to `fetch('/api/...')` is a drop-in change.
 * State lives in module memory and resets on full page reload.
 */

const db = {
  events: EVENTS.map((e) => ({ ...e })),
  tickets: createSeedTickets(),
  auditLog: createSeedAuditLog(),
}

export class ApiError extends Error {
  constructor(
    message: string,
    public code: 'SOLD_OUT' | 'ALREADY_REGISTERED' | 'NOT_FOUND' | 'VALIDATION',
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

const latency = (ms = 350) => new Promise((r) => setTimeout(r, ms))

export function isPastEvent(event: CampusEvent) {
  return new Date(event.endsAt).getTime() < Date.now()
}

export function isSoldOut(event: CampusEvent) {
  return event.registered >= event.capacity
}

export function getQrPayload(ticket: Ticket) {
  return buildQrPayload(ticket.code, ticket.signature)
}

function findEvent(idOrSlug: string) {
  return db.events.find((e) => e.id === idOrSlug || e.slug === idOrSlug)
}

function toAttendee(ticket: Ticket): Attendee {
  const event = findEvent(ticket.eventId)
  return {
    name: ticket.attendee.fullName,
    studentId: ticket.attendee.studentId,
    email: ticket.attendee.email,
    department: ticket.attendee.department,
    ticketCode: ticket.code,
    seat: ticket.seat,
    eventId: ticket.eventId,
    eventTitle: event?.title ?? 'Unknown event',
  }
}

/** Synchronous read used for server rendering & SWR fallback data. */
export function getEventsSync(): CampusEvent[] {
  return db.events.filter((e) => !isPastEvent(e))
}

export function getEventSync(idOrSlug: string): CampusEvent | undefined {
  return findEvent(idOrSlug)
}

export async function getEvents(): Promise<CampusEvent[]> {
  await latency(150)
  return getEventsSync().map((e) => ({ ...e }))
}

export async function getEvent(idOrSlug: string): Promise<CampusEvent | null> {
  await latency(150)
  const event = findEvent(idOrSlug)
  return event ? { ...event } : null
}

function generateTicketCode(eventCode: string) {
  let code = ''
  do {
    code = `TKT-${eventCode}-${Math.floor(10000 + Math.random() * 90000)}`
  } while (db.tickets.some((t) => t.code === code))
  return code
}

export async function registerForEvent(
  eventId: string,
  input: AttendeeInput,
): Promise<RegistrationResponse> {
  await latency(900)
  const event = findEvent(eventId)
  if (!event) throw new ApiError('Event not found', 'NOT_FOUND')
  if (isSoldOut(event)) throw new ApiError('This event is sold out', 'SOLD_OUT')

  const email = input.email.trim().toLowerCase()
  const studentId = input.studentId.trim().toUpperCase()
  const duplicate = db.tickets.find(
    (t) =>
      t.eventId === event.id &&
      (t.attendee.email.toLowerCase() === email || t.attendee.studentId.toUpperCase() === studentId),
  )
  if (duplicate) {
    throw new ApiError(
      `A ticket (${duplicate.code}) already exists for this student on this event.`,
      'ALREADY_REGISTERED',
    )
  }

  const code = generateTicketCode(event.code)
  const ticket: Ticket = {
    code,
    eventId: event.id,
    attendee: {
      fullName: input.fullName.trim(),
      email,
      studentId,
      department: input.department,
    },
    seat: `Seat ${String.fromCharCode(65 + (event.registered % 8))}${(event.registered % 24) + 1}`,
    issuedAt: new Date().toISOString(),
    checkedInAt: null,
    signature: signTicket(code),
    emailDispatched: true,
    ownedByCurrentUser: true,
  }

  db.tickets.unshift(ticket)
  event.registered += 1
  return { ticket: { ...ticket }, event: { ...event } }
}

export async function getTicket(code: string): Promise<RegistrationResponse | null> {
  await latency(150)
  const ticket = db.tickets.find((t) => t.code === code.toUpperCase())
  if (!ticket) return null
  const event = findEvent(ticket.eventId)
  if (!event) return null
  return { ticket: { ...ticket }, event: { ...event } }
}

export async function getLatestTicket(): Promise<RegistrationResponse | null> {
  const mine = db.tickets.find((t) => t.ownedByCurrentUser)
  return mine ? getTicket(mine.code) : null
}

export async function getMyTickets(): Promise<RegistrationResponse[]> {
  await latency(200)
  return db.tickets
    .filter((t) => t.ownedByCurrentUser)
    .map((ticket) => ({ ticket: { ...ticket }, event: { ...findEvent(ticket.eventId)! } }))
}

function log(entry: Omit<AuditLogEntry, 'id' | 'scannedAt' | 'gate'>) {
  db.auditLog.unshift({
    ...entry,
    id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    scannedAt: new Date().toISOString(),
    gate: LIVE_GATE.gate,
  })
}

export async function verifyTicket(
  token: string,
  method: AuditLogEntry['method'] = 'manual',
): Promise<VerificationResult> {
  await latency(450)
  const parsed = parseToken(token)

  if (!parsed) {
    log({ status: 'INVALID_TICKET', ticketCode: token.slice(0, 24) || '—', attendeeName: null, method })
    return { status: 'INVALID_TICKET', reason: 'Malformed ticket token' }
  }

  const ticket = db.tickets.find((t) => t.code === parsed.code)
  const expectedSignature = signTicket(parsed.code)

  if (parsed.signature !== null && parsed.signature !== expectedSignature) {
    log({ status: 'INVALID_TICKET', ticketCode: parsed.code, attendeeName: null, method })
    return { status: 'INVALID_TICKET', reason: 'Cryptographic signature mismatch' }
  }

  if (!ticket) {
    log({ status: 'INVALID_TICKET', ticketCode: parsed.code, attendeeName: null, method })
    return { status: 'INVALID_TICKET', reason: 'Ticket not found in event registry' }
  }

  if (ticket.eventId !== LIVE_GATE.eventId) {
    log({ status: 'INVALID_TICKET', ticketCode: ticket.code, attendeeName: ticket.attendee.fullName, method })
    return { status: 'INVALID_TICKET', reason: 'Ticket issued for a different event' }
  }

  if (ticket.checkedInAt) {
    log({ status: 'ALREADY_USED', ticketCode: ticket.code, attendeeName: ticket.attendee.fullName, method })
    return {
      status: 'ALREADY_USED',
      message: 'Ticket already used',
      attendee: toAttendee(ticket),
      originalCheckInTime: ticket.checkedInAt,
    }
  }

  ticket.checkedInAt = new Date().toISOString()
  log({ status: 'CHECKED_IN', ticketCode: ticket.code, attendeeName: ticket.attendee.fullName, method })
  return {
    status: 'CHECKED_IN',
    message: 'Ticket verified',
    attendee: toAttendee(ticket),
    checkedInAt: ticket.checkedInAt,
  }
}

export async function getGateStats(): Promise<GateStats> {
  await latency(100)
  const event = findEvent(LIVE_GATE.eventId)!
  const checkedIn =
    LIVE_GATE.baselineCheckedIn +
    db.tickets.filter((t) => t.eventId === event.id && t.checkedInAt).length
  return {
    eventId: event.id,
    eventTitle: event.title,
    gate: LIVE_GATE.gate,
    totalRegistered: event.registered,
    checkedIn,
    remaining: Math.max(event.registered - checkedIn, 0),
    attendancePct: Math.round((checkedIn / event.registered) * 1000) / 10,
  }
}

export async function getAuditLog(): Promise<AuditLogEntry[]> {
  await latency(100)
  return db.auditLog.slice(0, 25).map((e) => ({ ...e }))
}

/** Demo helpers: produce tokens that exercise each verification branch. */
export function getDemoToken(kind: 'valid' | 'duplicate' | 'tampered'): string {
  const liveTickets = db.tickets.filter((t) => t.eventId === LIVE_GATE.eventId)

  if (kind === 'duplicate') {
    const used = liveTickets.find((t) => t.checkedInAt) ?? liveTickets[0]
    return buildQrPayload(used.code, used.signature)
  }

  if (kind === 'tampered') {
    const target = liveTickets[Math.floor(Math.random() * liveTickets.length)]
    const forged = target.signature.split('').reverse().join('')
    return buildQrPayload(target.code, forged)
  }

  let fresh = liveTickets.find((t) => !t.checkedInAt && !t.ownedByCurrentUser)
  if (!fresh) {
    const event = findEvent(LIVE_GATE.eventId)!
    const code = generateTicketCode(event.code)
    const n = db.tickets.length
    fresh = {
      code,
      eventId: event.id,
      attendee: {
        fullName: `Walk-in Attendee ${n}`,
        email: `walkin${n}@campus.edu`,
        studentId: `24GN${String(1000 + n)}`,
        department: 'Computer Science',
      },
      seat: `Table ${20 + (n % 30)}`,
      issuedAt: new Date().toISOString(),
      checkedInAt: null,
      signature: signTicket(code),
      emailDispatched: true,
      ownedByCurrentUser: false,
    }
    db.tickets.push(fresh)
  }
  return buildQrPayload(fresh.code, fresh.signature)
}

export async function getOrganizerStats(): Promise<OrganizerStats> {
  await latency(120)
  const totalEvents = db.events.length
  const totalRegistrations = db.events.reduce((sum, e) => sum + e.registered, 0)
  const totalCheckedIn =
    LIVE_GATE.baselineCheckedIn +
    db.tickets.filter((t) => t.checkedInAt !== null).length
  const remainingAttendees = Math.max(0, totalRegistrations - totalCheckedIn)
  const attendancePct = totalRegistrations > 0 ? Math.round((totalCheckedIn / totalRegistrations) * 1000) / 10 : 0

  return {
    totalEvents,
    totalRegistrations,
    totalCheckedIn,
    remainingAttendees,
    attendancePct,
  }
}

export async function getOrganizerEvents(): Promise<CampusEvent[]> {
  await latency(120)
  return db.events.map((e) => ({ ...e }))
}

export async function createOrganizerEvent(input: CreateEventInput): Promise<CampusEvent> {
  await latency(300)
  const id = `evt_${Date.now()}`
  const slug = input.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  const code = input.title.replace(/[^A-Za-z]/g, '').slice(0, 4).toUpperCase() || 'EVNT'

  const newEvent: CampusEvent = {
    id,
    slug,
    code,
    title: input.title,
    tagline: input.tagline,
    description: input.description,
    category: input.category,
    startsAt: input.startsAt,
    endsAt: input.endsAt,
    venue: input.venue,
    venueDetails: input.venueDetails || 'Standard seating',
    address: input.address || 'Campus Grounds',
    organizer: input.organizer,
    coverImage: input.coverImage || '/events/hacksprint.png',
    capacity: input.capacity,
    registered: 0,
    schedule: [{ time: 'Start', title: 'Check-in & Opening' }],
    highlights: ['Campus Event', 'Official Pass'],
  }

  db.events.unshift(newEvent)
  return { ...newEvent }
}

export async function getAllRegistrations(): Promise<EventRegistrationRecord[]> {
  await latency(150)
  return db.tickets.map((ticket) => {
    const event = findEvent(ticket.eventId) ?? db.events[0]
    return { ticket: { ...ticket }, event: { ...event } }
  })
}

export async function getCheckInHistory(params?: {
  eventId?: string
  status?: string
  search?: string
}): Promise<AuditLogEntry[]> {
  await latency(120)
  let list = db.auditLog.map((e) => ({ ...e }))

  if (params?.status && params.status !== 'ALL') {
    list = list.filter((e) => e.status === params.status)
  }

  if (params?.search) {
    const q = params.search.toLowerCase()
    list = list.filter(
      (e) =>
        e.ticketCode.toLowerCase().includes(q) ||
        (e.attendeeName && e.attendeeName.toLowerCase().includes(q))
    )
  }

  return list
}

export { CURRENT_USER }

