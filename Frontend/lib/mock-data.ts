import type { AuditLogEntry, CampusEvent, EventCategory, Ticket } from './types'
import { signTicket } from './signing'

export const CATEGORIES: ('All' | EventCategory)[] = [
  'All',
  'Hackathons',
  'Bootcamps',
  'Conferences',
  'Security Labs',
]

export const DEPARTMENTS = [
  'Computer Science',
  'Information Technology',
  'Electronics & Communication',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Data Science',
  'Design',
  'Business Administration',
]

export const CURRENT_USER = {
  fullName: 'Aarav Sharma',
  email: 'aarav.sharma@campus.edu',
  studentId: '22CS1047',
  department: 'Computer Science',
}

export const LIVE_GATE = {
  eventId: 'evt_hacksprint',
  gate: 'Gate #1',
  baselineCheckedIn: 95,
}

export const EVENTS: CampusEvent[] = [
  {
    id: 'evt_hacksprint',
    slug: 'hacksprint-2026',
    code: 'HACK',
    title: 'HackSprint 2026',
    tagline: 'A 36-hour build marathon for student makers.',
    description:
      'Form a team of up to four, pick a track, and ship a working prototype in 36 hours. Mentors from industry partners will be on the floor all night, with API credits, hardware kits, and a ₹2,00,000 prize pool across five tracks.',
    category: 'Hackathons',
    startsAt: '2026-10-24T09:00:00+05:30',
    endsAt: '2026-10-25T21:00:00+05:30',
    venue: 'Innovation Hub, Block C',
    venueDetails: 'Ground floor maker space · Wi-Fi, power at every seat, 24/7 cafeteria access',
    address: 'North Campus, University Road',
    organizer: 'ACM Student Chapter',
    coverImage: '/events/hacksprint.png',
    capacity: 200,
    registered: 184,
    schedule: [
      { time: 'Day 1 · 09:00', title: 'Check-in & breakfast', description: 'Scan your QR pass at Gate #1.' },
      { time: 'Day 1 · 10:00', title: 'Opening keynote & track reveal' },
      { time: 'Day 1 · 11:00', title: 'Hacking begins' },
      { time: 'Day 2 · 15:00', title: 'Code freeze & demo submissions' },
      { time: 'Day 2 · 18:00', title: 'Final demos & awards' },
    ],
    highlights: ['5 tracks', '₹2L prize pool', 'Mentors on-site', 'Meals included'],
  },
  {
    id: 'evt_cloud',
    slug: 'cloud-native-bootcamp',
    code: 'CLOU',
    title: 'Cloud Native Bootcamp',
    tagline: 'Kubernetes from zero to production in one weekend.',
    description:
      'A hands-on, lab-driven bootcamp covering containers, Kubernetes primitives, CI/CD pipelines, and observability. Every attendee gets a sandbox cluster for the duration of the program.',
    category: 'Bootcamps',
    startsAt: '2026-10-17T10:00:00+05:30',
    endsAt: '2026-10-18T17:00:00+05:30',
    venue: 'Lab 204, Computing Centre',
    venueDetails: 'Workstations provided · Bring your laptop for take-home labs',
    address: 'Central Campus, Library Lane',
    organizer: 'Cloud Computing Club',
    coverImage: '/events/cloud-bootcamp.png',
    capacity: 120,
    registered: 117,
    schedule: [
      { time: 'Day 1 · 10:00', title: 'Containers & images' },
      { time: 'Day 1 · 14:00', title: 'Kubernetes core objects' },
      { time: 'Day 2 · 10:00', title: 'CI/CD with GitOps' },
      { time: 'Day 2 · 14:00', title: 'Observability & capstone' },
    ],
    highlights: ['Sandbox cluster', 'Certificate', 'Lab-driven'],
  },
  {
    id: 'evt_ai_summit',
    slug: 'campus-ai-summit',
    code: 'AISM',
    title: 'Campus AI Summit 2026',
    tagline: 'Keynotes and panels on applied AI research.',
    description:
      'A full-day conference featuring faculty researchers, alumni founders, and industry practitioners discussing the state of applied AI, from foundation models to responsible deployment.',
    category: 'Conferences',
    startsAt: '2026-11-06T09:30:00+05:30',
    endsAt: '2026-11-06T18:00:00+05:30',
    venue: 'Main Auditorium',
    venueDetails: '500-seat auditorium · Live-streamed to Hall B overflow',
    address: 'Central Campus, Convocation Plaza',
    organizer: 'Department of Computer Science',
    coverImage: '/events/ai-summit.png',
    capacity: 500,
    registered: 500,
    schedule: [
      { time: '09:30', title: 'Registration & check-in' },
      { time: '10:00', title: 'Opening keynote' },
      { time: '13:00', title: 'Research poster session' },
      { time: '15:00', title: 'Panel: Responsible AI on campus' },
    ],
    highlights: ['12 speakers', 'Poster session', 'Networking lunch'],
  },
  {
    id: 'evt_ctf',
    slug: 'red-team-ctf-lab',
    code: 'CTFL',
    title: 'Capture The Flag: Red Team Lab',
    tagline: 'Attack-defense CTF in an isolated range.',
    description:
      'Test your offensive security skills across web exploitation, reverse engineering, cryptography, and forensics challenges inside an isolated cyber range. Beginner-friendly warmup track included.',
    category: 'Security Labs',
    startsAt: '2026-10-31T13:00:00+05:30',
    endsAt: '2026-10-31T20:00:00+05:30',
    venue: 'Cyber Range, Block E',
    venueDetails: 'Air-gapped lab · Personal devices must stay in lockers',
    address: 'East Campus, Engineering Quad',
    organizer: 'InfoSec Society',
    coverImage: '/events/ctf-lab.png',
    capacity: 60,
    registered: 41,
    schedule: [
      { time: '13:00', title: 'Rules of engagement briefing' },
      { time: '13:30', title: 'Warmup track' },
      { time: '15:00', title: 'Main CTF round' },
      { time: '19:30', title: 'Write-ups & scoreboard' },
    ],
    highlights: ['Isolated range', 'Beginner track', 'Swag for top 10'],
  },
  {
    id: 'evt_design',
    slug: 'design-systems-conf',
    code: 'DSGN',
    title: 'Design Systems Conference',
    tagline: 'Building interfaces that scale across teams.',
    description:
      'Talks and workshops on tokens, component architecture, accessibility, and design-engineering collaboration, hosted by the Design Society with guest speakers from product studios.',
    category: 'Conferences',
    startsAt: '2026-11-14T10:00:00+05:30',
    endsAt: '2026-11-14T17:30:00+05:30',
    venue: 'Hall B, Arts Building',
    venueDetails: 'Theatre seating · Workshop rooms on level 2',
    address: 'West Campus, Arts Avenue',
    organizer: 'Design Society',
    coverImage: '/events/design-conf.png',
    capacity: 300,
    registered: 212,
    schedule: [
      { time: '10:00', title: 'Keynote: Tokens all the way down' },
      { time: '12:00', title: 'Accessibility workshop' },
      { time: '15:00', title: 'Design-engineering panel' },
    ],
    highlights: ['Workshops', 'Portfolio reviews', 'Free entry'],
  },
  {
    id: 'evt_ts',
    slug: 'full-stack-typescript-bootcamp',
    code: 'TSBC',
    title: 'Full-Stack TypeScript Bootcamp',
    tagline: 'Ship a typed web app end-to-end.',
    description:
      'Learn modern full-stack development with TypeScript, React, server components, and Postgres. Pair-program through a guided project and deploy it before the bootcamp ends.',
    category: 'Bootcamps',
    startsAt: '2026-11-21T10:00:00+05:30',
    endsAt: '2026-11-22T16:00:00+05:30',
    venue: 'Lab 108, Computing Centre',
    venueDetails: 'Pair-programming stations · Bring your laptop',
    address: 'Central Campus, Library Lane',
    organizer: 'Web Dev Guild',
    coverImage: '/events/ts-bootcamp.png',
    capacity: 80,
    registered: 52,
    schedule: [
      { time: 'Day 1 · 10:00', title: 'TypeScript foundations' },
      { time: 'Day 1 · 14:00', title: 'React & server components' },
      { time: 'Day 2 · 10:00', title: 'Data layer with Postgres' },
      { time: 'Day 2 · 14:00', title: 'Deploy & demo' },
    ],
    highlights: ['Guided project', 'Pair programming', 'Certificate'],
  },
  {
    id: 'evt_rust',
    slug: 'intro-to-rust-workshop',
    code: 'RUST',
    title: 'Intro to Rust Workshop',
    tagline: 'Ownership, borrowing, and fearless concurrency.',
    description:
      'A half-day introductory workshop on systems programming with Rust, covering the ownership model, error handling, and building a small CLI tool.',
    category: 'Bootcamps',
    startsAt: '2026-09-19T14:00:00+05:30',
    endsAt: '2026-09-19T18:00:00+05:30',
    venue: 'Seminar Room 3, Block A',
    venueDetails: 'Seminar seating · Laptops required',
    address: 'North Campus, University Road',
    organizer: 'Systems Programming Club',
    coverImage: '/events/rust-workshop.png',
    capacity: 40,
    registered: 40,
    schedule: [
      { time: '14:00', title: 'Ownership & borrowing' },
      { time: '16:00', title: 'Build a CLI tool' },
    ],
    highlights: ['Half-day', 'Hands-on'],
  },
]

function minutesAgo(min: number) {
  return new Date(Date.now() - min * 60_000).toISOString()
}

function makeTicket(
  code: string,
  eventId: string,
  attendee: Ticket['attendee'],
  seat: string,
  opts: Partial<Pick<Ticket, 'checkedInAt' | 'ownedByCurrentUser' | 'issuedAt'>> = {},
): Ticket {
  return {
    code,
    eventId,
    attendee,
    seat,
    issuedAt: opts.issuedAt ?? '2026-10-01T12:00:00+05:30',
    checkedInAt: opts.checkedInAt ?? null,
    signature: signTicket(code),
    emailDispatched: true,
    ownedByCurrentUser: opts.ownedByCurrentUser ?? false,
  }
}

export function createSeedTickets(): Ticket[] {
  return [
    makeTicket('TKT-HACK-84920', 'evt_hacksprint', CURRENT_USER, 'Table 14', {
      ownedByCurrentUser: true,
      issuedAt: '2026-10-02T18:24:00+05:30',
    }),
    makeTicket('TKT-CLOU-31207', 'evt_cloud', CURRENT_USER, 'Station 22', {
      ownedByCurrentUser: true,
      checkedInAt: minutesAgo(52),
    }),
    makeTicket('TKT-RUST-55102', 'evt_rust', CURRENT_USER, 'Seat A7', {
      ownedByCurrentUser: true,
      issuedAt: '2026-09-10T10:00:00+05:30',
      checkedInAt: '2026-09-19T13:52:00+05:30',
    }),
    makeTicket(
      'TKT-HACK-61834',
      'evt_hacksprint',
      { fullName: 'Priya Nair', email: 'priya.nair@campus.edu', studentId: '22IT0391', department: 'Information Technology' },
      'Table 03',
      { checkedInAt: minutesAgo(14) },
    ),
    makeTicket(
      'TKT-HACK-20457',
      'evt_hacksprint',
      { fullName: 'Rohan Mehta', email: 'rohan.mehta@campus.edu', studentId: '23CS0218', department: 'Computer Science' },
      'Table 07',
    ),
    makeTicket(
      'TKT-HACK-77310',
      'evt_hacksprint',
      { fullName: 'Sara Thomas', email: 'sara.thomas@campus.edu', studentId: '21DS0112', department: 'Data Science' },
      'Table 09',
    ),
    makeTicket(
      'TKT-HACK-39028',
      'evt_hacksprint',
      { fullName: 'Kabir Singh', email: 'kabir.singh@campus.edu', studentId: '22EC0764', department: 'Electronics & Communication' },
      'Table 11',
    ),
    makeTicket(
      'TKT-HACK-50613',
      'evt_hacksprint',
      { fullName: 'Ananya Iyer', email: 'ananya.iyer@campus.edu', studentId: '23DS0045', department: 'Data Science' },
      'Table 16',
    ),
    makeTicket(
      'TKT-HACK-92741',
      'evt_hacksprint',
      { fullName: 'Dev Patel', email: 'dev.patel@campus.edu', studentId: '22CS0880', department: 'Computer Science' },
      'Table 18',
    ),
    makeTicket(
      'TKT-HACK-14586',
      'evt_hacksprint',
      { fullName: 'Meera Krishnan', email: 'meera.k@campus.edu', studentId: '21EE0233', department: 'Electrical Engineering' },
      'Table 21',
    ),
  ]
}

export function createSeedAuditLog(): AuditLogEntry[] {
  return [
    {
      id: 'log_seed_1',
      scannedAt: minutesAgo(14),
      status: 'CHECKED_IN',
      ticketCode: 'TKT-HACK-61834',
      attendeeName: 'Priya Nair',
      gate: 'Gate #1',
      method: 'camera',
    },
    {
      id: 'log_seed_2',
      scannedAt: minutesAgo(11),
      status: 'INVALID_TICKET',
      ticketCode: 'TKT-HACK-00000',
      attendeeName: null,
      gate: 'Gate #1',
      method: 'manual',
    },
    {
      id: 'log_seed_3',
      scannedAt: minutesAgo(6),
      status: 'ALREADY_USED',
      ticketCode: 'TKT-HACK-61834',
      attendeeName: 'Priya Nair',
      gate: 'Gate #1',
      method: 'camera',
    },
  ]
}
