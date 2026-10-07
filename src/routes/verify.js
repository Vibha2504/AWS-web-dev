const express = require('express');
const router = express.Router();
const db = require('../db/database');
const cryptoService = require('../services/cryptoService');

/**
 * POST /api/verify/scan
 * Primary verification endpoint receiving scanned QR tokens from webcam or scanner
 */
router.post('/scan', (req, res) => {
  try {
    const { token, eventId, scannerDevice } = req.body;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({
        status: 'INVALID_TICKET',
        alertType: 'error',
        badge: 'INVALID TICKET',
        reason: 'Empty or malformed QR token payload received.',
        timestamp: new Date().toISOString()
      });
    }

    const trimmedToken = token.trim();

    // 1. Cryptographic Signature Validation
    const cryptoCheck = cryptoService.verifyTicketToken(trimmedToken);

    if (!cryptoCheck.valid) {
      // Counterfeit or tampered QR code
      db.logScanRecord({
        eventId: eventId || null,
        ticketCode: 'MALFORMED',
        rawToken: trimmedToken.substring(0, 80),
        resultStatus: 'INVALID_TICKET',
        reason: cryptoCheck.reason,
        studentName: 'Unverified',
        scannerDevice: scannerDevice || 'Organizer Scanner'
      });

      return res.json({
        status: 'INVALID_TICKET',
        alertType: 'error',
        badge: 'INVALID TICKET',
        reason: cryptoCheck.reason,
        details: 'The cryptographic signature of this QR code failed validation. The ticket may be forged or modified.',
        timestamp: new Date().toISOString()
      });
    }

    // 2. Process check-in in database with anti-duplication transaction lock
    const { payload } = cryptoCheck;
    const result = db.processTicketCheckIn({
      ticketCode: payload.ticketCode,
      eventId: eventId ? parseInt(eventId, 10) : null,
      scannerDevice: scannerDevice || 'Organizer Scanner',
      rawToken: trimmedToken
    });

    const timestamp = new Date().toISOString();

    if (result.status === 'CHECKED_IN') {
      return res.json({
        status: 'CHECKED_IN',
        alertType: 'success',
        badge: 'CHECKED-IN',
        message: 'Entry Approved: Attendee successfully checked in!',
        ticketCode: payload.ticketCode,
        attendee: {
          name: result.attendee.student_name,
          email: result.attendee.student_email,
          studentId: result.attendee.student_id,
          department: result.attendee.department,
          eventTitle: result.attendee.event_title,
          eventLocation: result.attendee.event_location
        },
        checkedInAt: result.checkedInAt,
        timestamp
      });
    }

    if (result.status === 'ALREADY_USED') {
      return res.json({
        status: 'ALREADY_USED',
        alertType: 'warning',
        badge: 'ALREADY USED',
        message: 'Entry Denied: This ticket has already been checked in!',
        ticketCode: payload.ticketCode,
        attendee: result.attendee ? {
          name: result.attendee.student_name,
          email: result.attendee.student_email,
          studentId: result.attendee.student_id,
          department: result.attendee.department,
          eventTitle: result.attendee.event_title,
          eventLocation: result.attendee.event_location
        } : null,
        originalCheckInTime: result.checkedInAt,
        reason: result.reason,
        timestamp
      });
    }

    // Result is INVALID_TICKET (e.g. wrong event gate or ticket not found)
    return res.json({
      status: 'INVALID_TICKET',
      alertType: 'error',
      badge: 'INVALID TICKET',
      message: result.reason,
      reason: result.reason,
      ticketCode: payload.ticketCode,
      attendee: result.attendee ? {
        name: result.attendee.student_name,
        eventTitle: result.attendee.event_title
      } : null,
      timestamp
    });

  } catch (err) {
    console.error('Scan verification error:', err);
    res.status(500).json({
      status: 'SERVER_ERROR',
      alertType: 'error',
      badge: 'ERROR',
      reason: 'Internal error processing ticket verification.'
    });
  }
});

/**
 * POST /api/verify/manual
 * Fallback verification endpoint for manual ticket code entry
 */
router.post('/manual', (req, res) => {
  try {
    const { ticketCode, eventId, scannerDevice } = req.body;

    if (!ticketCode || typeof ticketCode !== 'string') {
      return res.status(400).json({
        status: 'INVALID_TICKET',
        alertType: 'error',
        badge: 'INVALID TICKET',
        reason: 'Ticket code is required for manual check-in.'
      });
    }

    const cleanCode = ticketCode.trim().toUpperCase();

    const result = db.processTicketCheckIn({
      ticketCode: cleanCode,
      eventId: eventId ? parseInt(eventId, 10) : null,
      scannerDevice: scannerDevice || 'Manual Entry Fallback',
      rawToken: `MANUAL_${cleanCode}`
    });

    const timestamp = new Date().toISOString();

    if (result.status === 'CHECKED_IN') {
      return res.json({
        status: 'CHECKED_IN',
        alertType: 'success',
        badge: 'CHECKED-IN',
        message: 'Manual Entry Approved: Attendee successfully checked in!',
        ticketCode: cleanCode,
        attendee: {
          name: result.attendee.student_name,
          email: result.attendee.student_email,
          studentId: result.attendee.student_id,
          department: result.attendee.department,
          eventTitle: result.attendee.event_title,
          eventLocation: result.attendee.event_location
        },
        checkedInAt: result.checkedInAt,
        timestamp
      });
    }

    if (result.status === 'ALREADY_USED') {
      return res.json({
        status: 'ALREADY_USED',
        alertType: 'warning',
        badge: 'ALREADY USED',
        message: 'Manual Entry Denied: Ticket was already used!',
        ticketCode: cleanCode,
        attendee: result.attendee ? {
          name: result.attendee.student_name,
          email: result.attendee.student_email,
          studentId: result.attendee.student_id,
          department: result.attendee.department,
          eventTitle: result.attendee.event_title
        } : null,
        originalCheckInTime: result.checkedInAt,
        reason: result.reason,
        timestamp
      });
    }

    return res.json({
      status: 'INVALID_TICKET',
      alertType: 'error',
      badge: 'INVALID TICKET',
      message: result.reason,
      reason: result.reason,
      ticketCode: cleanCode,
      timestamp
    });

  } catch (err) {
    console.error('Manual verification error:', err);
    res.status(500).json({
      status: 'SERVER_ERROR',
      alertType: 'error',
      badge: 'ERROR',
      reason: 'Internal error processing manual verification.'
    });
  }
});

module.exports = router;
