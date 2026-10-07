const express = require('express');
const router = express.Router();
const db = require('../db/database');

/**
 * GET /api/events
 * Fetch all events with live capacity and remaining spots
 */
router.get('/', (req, res) => {
  try {
    const events = db.getAllEvents();
    res.json({ success: true, count: events.length, data: events });
  } catch (err) {
    console.error('Error fetching events:', err);
    res.status(500).json({ success: false, error: 'Failed to retrieve events.' });
  }
});

/**
 * GET /api/events/:id
 * Fetch a single event by ID with registration statistics
 */
router.get('/:id', (req, res) => {
  try {
    const eventId = parseInt(req.params.id, 10);
    const event = db.getEventById(eventId);

    if (!event) {
      return res.status(404).json({ success: false, error: 'Event not found.' });
    }

    res.json({ success: true, data: event });
  } catch (err) {
    console.error('Error fetching event:', err);
    res.status(500).json({ success: false, error: 'Failed to retrieve event.' });
  }
});

module.exports = router;
