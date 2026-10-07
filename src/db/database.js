const Database = require('better-sqlite3');
const path = require('path');
const config = require('../config');

// Initialize SQLite database with WAL mode for high-concurrency read/writes
const dbPath = path.resolve(config.dbPath);
const db = new Database(dbPath);

// Enable Write-Ahead Logging (WAL) for superior concurrency and performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Initialize schema
function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      tagline TEXT,
      description TEXT,
      category TEXT NOT NULL,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      location TEXT NOT NULL,
      banner_url TEXT,
      max_capacity INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_code TEXT UNIQUE NOT NULL,
      event_id INTEGER NOT NULL,
      student_name TEXT NOT NULL,
      student_email TEXT NOT NULL,
      student_id TEXT NOT NULL,
      department TEXT NOT NULL,
      qr_token TEXT UNIQUE NOT NULL,
      status TEXT NOT NULL DEFAULT 'ISSUED', -- 'ISSUED' | 'CHECKED_IN' | 'CANCELLED'
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      checked_in_at DATETIME DEFAULT NULL,
      checked_in_by TEXT DEFAULT NULL,
      FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS scan_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER,
      ticket_code TEXT,
      raw_token TEXT,
      result_status TEXT NOT NULL, -- 'CHECKED_IN' | 'ALREADY_USED' | 'INVALID_TICKET'
      reason TEXT,
      student_name TEXT,
      scanner_device TEXT DEFAULT 'Webcam Portal',
      scan_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_tickets_event ON tickets(event_id);
    CREATE INDEX IF NOT EXISTS idx_tickets_code ON tickets(ticket_code);
    CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
    CREATE INDEX IF NOT EXISTS idx_scan_logs_timestamp ON scan_logs(scan_timestamp DESC);
  `);
}

initSchema();

/**
 * Get all events with live registration counts and capacity status
 */
function getAllEvents() {
  const stmt = db.prepare(`
    SELECT 
      e.*,
      COUNT(t.id) AS registered_count,
      (e.max_capacity - COUNT(t.id)) AS remaining_spots,
      CASE WHEN COUNT(t.id) >= e.max_capacity THEN 1 ELSE 0 END AS is_full
    FROM events e
    LEFT JOIN tickets t ON e.id = t.event_id
    GROUP BY e.id
    ORDER BY e.date ASC
  `);
  return stmt.all();
}

/**
 * Get a single event by ID with live counts
 */
function getEventById(id) {
  const stmt = db.prepare(`
    SELECT 
      e.*,
      COUNT(t.id) AS registered_count,
      (e.max_capacity - COUNT(t.id)) AS remaining_spots,
      CASE WHEN COUNT(t.id) >= e.max_capacity THEN 1 ELSE 0 END AS is_full
    FROM events e
    LEFT JOIN tickets t ON e.id = t.event_id
    WHERE e.id = ?
    GROUP BY e.id
  `);
  return stmt.get(id);
}

/**
 * Create a new ticket registration within an ACID transaction to prevent capacity oversubscription
 */
const registerAttendee = db.transaction((attendeeData) => {
  const { eventId, studentName, studentEmail, studentId, department, ticketCode, qrToken } = attendeeData;

  // 1. Lock and inspect event capacity inside the transaction
  const event = db.prepare(`
    SELECT e.max_capacity, COUNT(t.id) AS current_count
    FROM events e
    LEFT JOIN tickets t ON e.id = t.event_id
    WHERE e.id = ?
    GROUP BY e.id
  `).get(eventId);

  if (!event) {
    const err = new Error('Event not found');
    err.code = 'NOT_FOUND';
    throw err;
  }

  if (event.current_count >= event.max_capacity) {
    const err = new Error(`Venue capacity of ${event.max_capacity} has been reached for this event.`);
    err.code = 'CAPACITY_REACHED';
    throw err;
  }

  // 2. Prevent duplicate registrations by the same student for the same event
  const existing = db.prepare(`
    SELECT id, ticket_code FROM tickets 
    WHERE event_id = ? AND (LOWER(student_email) = LOWER(?) OR LOWER(student_id) = LOWER(?))
  `).get(eventId, studentEmail, studentId);

  if (existing) {
    const err = new Error(`A ticket (${existing.ticket_code}) has already been registered with this email or student ID.`);
    err.code = 'ALREADY_REGISTERED';
    throw err;
  }

  // 3. Insert new ticket
  const insertStmt = db.prepare(`
    INSERT INTO tickets (ticket_code, event_id, student_name, student_email, student_id, department, qr_token, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'ISSUED')
  `);
  const result = insertStmt.run(ticketCode, eventId, studentName, studentEmail.trim().toLowerCase(), studentId.trim().toUpperCase(), department, qrToken);

  return db.prepare('SELECT * FROM tickets WHERE id = ?').get(result.lastInsertRowid);
});

/**
 * Check-In a ticket with anti-duplication transaction lock
 */
const processTicketCheckIn = db.transaction(({ ticketCode, eventId, scannerDevice, rawToken }) => {
  // Query ticket
  const ticket = db.prepare(`
    SELECT t.*, e.title AS event_title, e.location AS event_location
    FROM tickets t
    JOIN events e ON t.event_id = e.id
    WHERE t.ticket_code = ?
  `).get(ticketCode);

  if (!ticket) {
    logScanRecord({
      eventId: eventId || null,
      ticketCode: ticketCode || 'UNKNOWN',
      rawToken: rawToken || null,
      resultStatus: 'INVALID_TICKET',
      reason: 'Ticket not found in database',
      studentName: 'Unknown',
      scannerDevice
    });
    return {
      status: 'INVALID_TICKET',
      reason: 'Ticket code was not found in the database.'
    };
  }

  // Check if ticket is for the selected event gate (if organizer filtered by event)
  if (eventId && Number(ticket.event_id) !== Number(eventId)) {
    logScanRecord({
      eventId: ticket.event_id,
      ticketCode: ticket.ticket_code,
      rawToken,
      resultStatus: 'INVALID_TICKET',
      reason: `Ticket is registered for "${ticket.event_title}", not this event gate`,
      studentName: ticket.student_name,
      scannerDevice
    });
    return {
      status: 'INVALID_TICKET',
      reason: `This ticket is registered for "${ticket.event_title}", not this event gate.`,
      attendee: ticket
    };
  }

  // Case: Ticket is ALREADY USED (Duplicate scan detection)
  if (ticket.status === 'CHECKED_IN') {
    logScanRecord({
      eventId: ticket.event_id,
      ticketCode: ticket.ticket_code,
      rawToken,
      resultStatus: 'ALREADY_USED',
      reason: `Duplicate scan. Originally checked in at ${ticket.checked_in_at}`,
      studentName: ticket.student_name,
      scannerDevice
    });
    return {
      status: 'ALREADY_USED',
      reason: 'This ticket has already been checked in.',
      checkedInAt: ticket.checked_in_at,
      attendee: ticket
    };
  }

  // Case: First valid scan -> Mark as CHECKED-IN atomically
  const now = new Date().toISOString();
  const updateStmt = db.prepare(`
    UPDATE tickets 
    SET status = 'CHECKED_IN', checked_in_at = ?, checked_in_by = ?
    WHERE id = ? AND status = 'ISSUED'
  `);
  const updateResult = updateStmt.run(now, scannerDevice || 'Organizer Portal', ticket.id);

  if (updateResult.changes === 0) {
    // A concurrent race-condition check-in succeeded just before this query
    const refreshed = db.prepare('SELECT * FROM tickets WHERE id = ?').get(ticket.id);
    logScanRecord({
      eventId: ticket.event_id,
      ticketCode: ticket.ticket_code,
      rawToken,
      resultStatus: 'ALREADY_USED',
      reason: 'Concurrent scan detected: Ticket was already processed',
      studentName: ticket.student_name,
      scannerDevice
    });
    return {
      status: 'ALREADY_USED',
      reason: 'This ticket was just checked in concurrently at another station.',
      checkedInAt: refreshed.checked_in_at,
      attendee: refreshed
    };
  }

  logScanRecord({
    eventId: ticket.event_id,
    ticketCode: ticket.ticket_code,
    rawToken,
    resultStatus: 'CHECKED_IN',
    reason: 'First valid entry verification',
    studentName: ticket.student_name,
    scannerDevice
  });

  return {
    status: 'CHECKED_IN',
    reason: 'Attendee successfully verified and checked in.',
    checkedInAt: now,
    attendee: {
      ...ticket,
      status: 'CHECKED_IN',
      checked_in_at: now
    }
  };
});

/**
 * Insert an audit log record for every scan
 */
function logScanRecord({ eventId, ticketCode, rawToken, resultStatus, reason, studentName, scannerDevice }) {
  try {
    const stmt = db.prepare(`
      INSERT INTO scan_logs (event_id, ticket_code, raw_token, result_status, reason, student_name, scanner_device)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(eventId || null, ticketCode || null, rawToken || null, resultStatus, reason || null, studentName || null, scannerDevice || 'Webcam Portal');
  } catch (err) {
    console.error('Failed to write scan log:', err.message);
  }
}

/**
 * Fetch scan audit logs
 */
function getScanLogs(limit = 30, eventId = null) {
  if (eventId) {
    return db.prepare(`
      SELECT s.*, e.title AS event_title 
      FROM scan_logs s
      LEFT JOIN events e ON s.event_id = e.id
      WHERE s.event_id = ?
      ORDER BY s.scan_timestamp DESC
      LIMIT ?
    `).all(eventId, limit);
  }
  return db.prepare(`
    SELECT s.*, e.title AS event_title 
    FROM scan_logs s
    LEFT JOIN events e ON s.event_id = e.id
    ORDER BY s.scan_timestamp DESC
    LIMIT ?
  `).all(limit);
}

/**
 * Fetch attendees for an event
 */
function getEventAttendees(eventId) {
  return db.prepare(`
    SELECT t.*, e.title AS event_title 
    FROM tickets t
    JOIN events e ON t.event_id = e.id
    WHERE t.event_id = ?
    ORDER BY t.created_at DESC
  `).all(eventId);
}

/**
 * Get ticket by code
 */
function getTicketByCode(ticketCode) {
  return db.prepare(`
    SELECT t.*, e.title AS event_title, e.date AS event_date, e.time AS event_time, e.location AS event_location
    FROM tickets t
    JOIN events e ON t.event_id = e.id
    WHERE t.ticket_code = ?
  `).get(ticketCode);
}

/**
 * Get overall dashboard analytics
 */
function getAdminStats() {
  const totalEvents = db.prepare('SELECT COUNT(*) as count FROM events').get().count;
  const totalTickets = db.prepare('SELECT COUNT(*) as count FROM tickets').get().count;
  const totalCheckedIn = db.prepare("SELECT COUNT(*) as count FROM tickets WHERE status = 'CHECKED_IN'").get().count;
  const totalScans = db.prepare('SELECT COUNT(*) as count FROM scan_logs').get().count;

  return {
    totalEvents,
    totalTickets,
    totalCheckedIn,
    totalPending: totalTickets - totalCheckedIn,
    totalScans,
    overallAttendanceRate: totalTickets > 0 ? Math.round((totalCheckedIn / totalTickets) * 100) : 0
  };
}

module.exports = {
  db,
  getAllEvents,
  getEventById,
  registerAttendee,
  processTicketCheckIn,
  logScanRecord,
  getScanLogs,
  getEventAttendees,
  getTicketByCode,
  getAdminStats
};
