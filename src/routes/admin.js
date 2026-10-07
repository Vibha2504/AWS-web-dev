const express = require('express');
const router = express.Router();
const db = require('../db/database');
const cryptoService = require('../services/cryptoService');
const { seedDatabase } = require('../db/seed');

/**
 * GET /api/admin/stats
 * Return overall dashboard analytics
 */
router.get('/stats', (req, res) => {
  try {
    const stats = db.getAdminStats();
    res.json({ success: true, stats });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ success: false, error: 'Failed to retrieve stats.' });
  }
});

/**
 * GET /api/admin/scans
 * Return real-time audit log of recent scans
 */
router.get('/scans', (req, res) => {
  try {
    const eventId = req.query.eventId ? parseInt(req.query.eventId, 10) : null;
    const limit = parseInt(req.query.limit || '30', 10);
    const logs = db.getScanLogs(limit, eventId);
    res.json({ success: true, count: logs.length, data: logs });
  } catch (err) {
    console.error('Scans log error:', err);
    res.status(500).json({ success: false, error: 'Failed to retrieve scan logs.' });
  }
});

/**
 * GET /api/admin/attendees/:eventId
 * Fetch registered attendees for an event
 */
router.get('/attendees/:eventId', (req, res) => {
  try {
    const eventId = parseInt(req.params.eventId, 10);
    const attendees = db.getEventAttendees(eventId);
    res.json({ success: true, count: attendees.length, data: attendees });
  } catch (err) {
    console.error('Attendees error:', err);
    res.status(500).json({ success: false, error: 'Failed to retrieve attendees.' });
  }
});

/**
 * POST /api/admin/reset
 * Reset database and re-seed
 */
router.post('/reset', (req, res) => {
  try {
    db.db.exec(`
      DELETE FROM scan_logs;
      DELETE FROM tickets;
      DELETE FROM events;
    `);
    seedDatabase();
    res.json({ success: true, message: 'Database reset and re-seeded successfully.' });
  } catch (err) {
    console.error('Reset error:', err);
    res.status(500).json({ success: false, error: 'Failed to reset database.' });
  }
});

/**
 * GET /api/admin/test-scenarios/:eventId
 * Generates ready-to-test tokens for the 4 primary test cases:
 * 1. Valid un-scanned ticket (triggers CHECKED-IN)
 * 2. Already used ticket (triggers ALREADY USED)
 * 3. Tampered ticket (triggers INVALID TICKET signature failure)
 * 4. Counterfeit/garbage token (triggers INVALID TICKET format failure)
 */
router.get('/test-scenarios/:eventId', (req, res) => {
  try {
    const eventId = parseInt(req.params.eventId, 10);
    const attendees = db.getEventAttendees(eventId);

    const issuedTicket = attendees.find(a => a.status === 'ISSUED');
    const checkedInTicket = attendees.find(a => a.status === 'CHECKED_IN');

    const validToken = issuedTicket ? issuedTicket.qr_token : null;
    const usedToken = checkedInTicket ? checkedInTicket.qr_token : null;
    const tamperedToken = validToken ? cryptoService.createTamperedToken(validToken) : null;
    const malformedToken = 'COUNTERFEIT_MALFORMED_GARBAGE_TOKEN_FORGED_12345';

    res.json({
      success: true,
      scenarios: {
        validIssued: {
          label: 'Case 1: Valid Ticket (Will Check In)',
          ticketCode: issuedTicket ? issuedTicket.ticket_code : null,
          studentName: issuedTicket ? issuedTicket.student_name : null,
          token: validToken,
          expectedResult: 'CHECKED_IN'
        },
        alreadyUsed: {
          label: 'Case 2: Already Used Ticket (Will Flag Duplicate)',
          ticketCode: checkedInTicket ? checkedInTicket.ticket_code : null,
          studentName: checkedInTicket ? checkedInTicket.student_name : null,
          token: usedToken,
          expectedResult: 'ALREADY_USED'
        },
        tamperedSignature: {
          label: 'Case 3: Tampered Signature (Signature Mismatch)',
          token: tamperedToken,
          expectedResult: 'INVALID_TICKET'
        },
        malformed: {
          label: 'Case 4: Counterfeit / Malformed Token',
          token: malformedToken,
          expectedResult: 'INVALID_TICKET'
        }
      }
    });
  } catch (err) {
    console.error('Test scenarios error:', err);
    res.status(500).json({ success: false, error: 'Failed to generate test scenarios.' });
  }
});

module.exports = router;
