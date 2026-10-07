const express = require('express');
const path = require('path');
const cors = require('cors');
const config = require('./config');
const { seedDatabase } = require('./db/seed');

// Initialize database schema and initial data
seedDatabase();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static assets
app.use(express.static(path.join(__dirname, '../public')));

// Explicit route aliases for portals
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.get('/organizer', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/scanner.html'));
});

app.get('/scanner', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/scanner.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/admin.html'));
});

// API Routes
app.use('/api/events', require('./routes/events'));
app.use('/api/tickets', require('./routes/tickets'));
app.use('/api/verify', require('./routes/verify'));
app.use('/api/admin', require('./routes/admin'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    env: config.nodeEnv
  });
});

// 404 handler for unknown API routes
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Fallback to index.html for SPA-style routes
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Start server
const server = app.listen(config.port, () => {
  console.log('====================================================');
  console.log(`🚀 Campus Event Ticketing & Check-In System Active`);
  console.log(`🌐 Participant Portal:    http://localhost:${config.port}`);
  console.log(`🔍 Organizer Scanner:    http://localhost:${config.port}/organizer`);
  console.log(`⚙️ Reviewer Admin Hub:    http://localhost:${config.port}/admin`);
  console.log(`🔐 Cryptographic Engine:  HMAC-SHA256 (Timing-Safe)`);
  console.log(`✉️ Email Service Mode:    ${config.email.provider.toUpperCase()}`);
  console.log('====================================================');
});

module.exports = { app, server };
