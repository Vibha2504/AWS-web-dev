const express = require('express');
const router = express.Router();
const db = require('../db/database');
const cryptoService = require('../services/cryptoService');
const qrService = require('../services/qrService');
const emailService = require('../services/emailService');

/**
 * Helper to generate human-readable ticket serial code
 */
function generateTicketCode(category) {
  const prefix = (category || 'GEN').substring(0, 4).toUpperCase();
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  return `TKT-${prefix}-${randomNum}`;
}

/**
 * POST /api/tickets/register
 * Register attendee for an event, enforce venue capacity, sign QR token, and dispatch email
 */
router.post('/register', async (req, res) => {
  try {
    const { eventId, studentName, studentEmail, studentId, department } = req.body;

    // 1. Validation
    if (!eventId || !studentName || !studentEmail || !studentId || !department) {
      return res.status(400).json({
        success: false,
        error: 'All fields (Event, Full Name, Student Email, Student ID, and Department) are required.'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(studentEmail)) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid email address.'
      });
    }

    const event = db.getEventById(parseInt(eventId, 10));
    if (!event) {
      return res.status(404).json({ success: false, error: 'Target event was not found.' });
    }

    // 2. Fast capacity pre-check
    if (event.registered_count >= event.max_capacity) {
      return res.status(409).json({
        success: false,
        error: `Registration closed: This event has reached its maximum venue capacity (${event.max_capacity} attendees).`
      });
    }

    // 3. Generate ticket code and cryptographically signed QR token
    const ticketCode = generateTicketCode(event.category);
    const qrToken = cryptoService.generateTicketToken({
      eventId: event.id,
      ticketCode,
      studentId: studentId.trim().toUpperCase(),
      studentEmail: studentEmail.trim().toLowerCase()
    });

    // 4. Execute atomic database registration with capacity transaction lock
    let newTicket;
    try {
      newTicket = db.registerAttendee({
        eventId: event.id,
        studentName: studentName.trim(),
        studentEmail: studentEmail.trim().toLowerCase(),
        studentId: studentId.trim().toUpperCase(),
        department: department.trim(),
        ticketCode,
        qrToken
      });
    } catch (dbErr) {
      if (dbErr.code === 'CAPACITY_REACHED') {
        return res.status(409).json({
          success: false,
          error: `Venue capacity reached! All ${event.max_capacity} seats have been reserved.`
        });
      }
      if (dbErr.code === 'ALREADY_REGISTERED') {
        return res.status(400).json({
          success: false,
          error: dbErr.message
        });
      }
      throw dbErr;
    }

    // 5. Generate QR Code Data URL for immediate front-end ticket presentation
    const qrDataUrl = await qrService.generateQrDataUrl(qrToken);

    // 6. Dispatch transactional email asynchronously
    let emailResult = { success: false };
    try {
      emailResult = await emailService.sendTicketEmail({
        event,
        ticket: newTicket
      });
    } catch (mailErr) {
      console.error('Transactional email dispatch error:', mailErr.message);
      emailResult = { success: false, error: mailErr.message };
    }

    res.status(201).json({
      success: true,
      message: 'Registration successful! Your digital pass has been generated and emailed.',
      ticket: {
        id: newTicket.id,
        ticketCode: newTicket.ticket_code,
        studentName: newTicket.student_name,
        studentEmail: newTicket.student_email,
        studentId: newTicket.student_id,
        department: newTicket.department,
        status: newTicket.status,
        createdAt: newTicket.created_at,
        qrToken: newTicket.qr_token
      },
      event: {
        id: event.id,
        title: event.title,
        date: event.date,
        time: event.time,
        location: event.location
      },
      qrDataUrl,
      emailDispatch: emailResult
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ success: false, error: 'Internal server error processing registration.' });
  }
});

/**
 * GET /api/tickets/:code
 * Fetch ticket details by ticket code
 */
router.get('/:code', async (req, res) => {
  try {
    const ticket = db.getTicketByCode(req.params.code);
    if (!ticket) {
      return res.status(404).json({ success: false, error: 'Ticket not found.' });
    }

    const qrDataUrl = await qrService.generateQrDataUrl(ticket.qr_token);

    res.json({
      success: true,
      ticket,
      qrDataUrl
    });
  } catch (err) {
    console.error('Error fetching ticket:', err);
    res.status(500).json({ success: false, error: 'Failed to retrieve ticket.' });
  }
});

module.exports = router;
