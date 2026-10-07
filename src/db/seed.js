const { db } = require('./database');
const cryptoService = require('../services/cryptoService');

function seedDatabase() {
  console.log('🌱 Seeding database with campus events...');

  // Clear existing data for fresh seed if requested
  const eventsCount = db.prepare('SELECT COUNT(*) as count FROM events').get().count;
  if (eventsCount > 0) {
    console.log(`Database already has ${eventsCount} events. Skipping initial seeding.`);
    return;
  }

  const insertEvent = db.prepare(`
    INSERT INTO events (slug, title, tagline, description, category, date, time, location, banner_url, max_capacity)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const events = [
    {
      slug: 'hacksphere-2026',
      title: 'HackSphere 2026: 24h Hackathon',
      tagline: 'Build, hack, and pitch groundbreaking solutions in 24 hours.',
      description: 'The premier university-wide hackathon welcoming developers, designers, and innovators. Compete for cash prizes, cloud credits, and club recruitment fast-tracks. Food, mentors, and red bull provided.',
      category: 'Hackathon',
      date: '2026-10-24',
      time: '09:00 AM - Next Day 09:00 AM',
      location: 'Main Auditorium & Innovation Lab (Ground Floor)',
      banner_url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200&auto=format&fit=crop&q=80',
      max_capacity: 45
    },
    {
      slug: 'aws-cloud-devops',
      title: 'AWS Cloud & DevOps Engineering Bootcamp',
      tagline: 'Master Serverless, EC2, Docker & CI/CD Pipelines.',
      description: 'Hands-on intensive workshop breaking down real-world cloud architectures. Learn how top tech companies orchestrate resilient microservices on AWS with real architecture reviews.',
      category: 'Workshop',
      date: '2026-10-28',
      time: '02:00 PM - 06:00 PM',
      location: 'Seminar Hall 3, CS & Engineering Wing',
      banner_url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80',
      max_capacity: 30
    },
    {
      slug: 'ai-agents-summit',
      title: 'Autonomous AI Agents & LLM Systems Summit',
      tagline: 'Deep dive into multi-agent systems, embeddings & RAG.',
      description: 'Explore the bleeding edge of agentic AI workflows, tool calling, model fine-tuning, and modern prompt engineering with university researchers and industry leads.',
      category: 'Conference',
      date: '2026-11-04',
      time: '10:00 AM - 04:30 PM',
      location: 'APJ Abdul Kalam Conference Center',
      banner_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80',
      max_capacity: 40
    },
    {
      slug: 'limited-vip-masterclass',
      title: 'Exclusive Hands-on PenTesting Lab (Limited Seats)',
      tagline: 'Ethical hacking & offensive security practical drill.',
      description: 'High-security sandbox training environment with isolated targets. Capacity is strictly limited to 3 students to test venue overflow and capacity rejection limits.',
      category: 'Cybersecurity',
      date: '2026-11-08',
      time: '05:00 PM - 07:30 PM',
      location: 'Cyber Defense Lab, Room 402',
      banner_url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&auto=format&fit=crop&q=80',
      max_capacity: 3 // Small capacity for easy testing of capacity rejection!
    }
  ];

  for (const evt of events) {
    insertEvent.run(
      evt.slug,
      evt.title,
      evt.tagline,
      evt.description,
      evt.category,
      evt.date,
      evt.time,
      evt.location,
      evt.banner_url,
      evt.max_capacity
    );
  }

  console.log('✅ Created 4 default events.');

  // Pre-populate some attendees for HackSphere and Limited Lab so the organizer scanner has live data right away
  const hackEvent = db.prepare('SELECT id FROM events WHERE slug = ?').get('hacksphere-2026');
  const limitedEvent = db.prepare('SELECT id FROM events WHERE slug = ?').get('limited-vip-masterclass');

  const insertTicket = db.prepare(`
    INSERT INTO tickets (ticket_code, event_id, student_name, student_email, student_id, department, qr_token, status, created_at, checked_in_at, checked_in_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const sampleAttendees = [
    {
      eventId: hackEvent.id,
      code: 'TKT-HACK-1001',
      name: 'Aarav Sharma',
      email: 'aarav.sharma@campus.edu',
      id: 'CS2026-042',
      dept: 'Computer Science',
      status: 'ISSUED',
      checkedInAt: null,
      checkedInBy: null
    },
    {
      eventId: hackEvent.id,
      code: 'TKT-HACK-1002',
      name: 'Ananya Patel',
      email: 'ananya.patel@campus.edu',
      id: 'IT2026-118',
      dept: 'Information Technology',
      status: 'CHECKED_IN',
      checkedInAt: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hours ago
      checkedInBy: 'Gate 1 Scanner'
    },
    {
      eventId: hackEvent.id,
      code: 'TKT-HACK-1003',
      name: 'Rohan Deshmukh',
      email: 'rohan.d@campus.edu',
      id: 'ECE2026-089',
      dept: 'Electronics & Communication',
      status: 'ISSUED',
      checkedInAt: null,
      checkedInBy: null
    },
    // Populate 2 out of 3 tickets for limited event
    {
      eventId: limitedEvent.id,
      code: 'TKT-VIP-9001',
      name: 'Vikram Seth',
      email: 'vikram.s@campus.edu',
      id: 'CS2026-010',
      dept: 'Computer Science',
      status: 'ISSUED',
      checkedInAt: null,
      checkedInBy: null
    },
    {
      eventId: limitedEvent.id,
      code: 'TKT-VIP-9002',
      name: 'Pooja Nair',
      email: 'pooja.nair@campus.edu',
      id: 'CS2026-015',
      dept: 'Computer Science',
      status: 'ISSUED',
      checkedInAt: null,
      checkedInBy: null
    }
  ];

  for (const att of sampleAttendees) {
    const token = cryptoService.generateTicketToken({
      eventId: att.eventId,
      ticketCode: att.code,
      studentId: att.id,
      studentEmail: att.email
    });

    insertTicket.run(
      att.code,
      att.eventId,
      att.name,
      att.email,
      att.id,
      att.dept,
      token,
      att.status,
      new Date(Date.now() - 86400000).toISOString(),
      att.checkedInAt,
      att.checkedInBy
    );
  }

  // Also log the previous check-in into scan_logs
  db.prepare(`
    INSERT INTO scan_logs (event_id, ticket_code, raw_token, result_status, reason, student_name, scanner_device, scan_timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    hackEvent.id,
    'TKT-HACK-1002',
    'SEED_TOKEN_SAMPLE',
    'CHECKED_IN',
    'First valid entry verification',
    'Ananya Patel',
    'Gate 1 Scanner',
    new Date(Date.now() - 3600000 * 2).toISOString()
  );

  console.log('✅ Seeded demo attendees & check-in log.');
}

module.exports = { seedDatabase };
