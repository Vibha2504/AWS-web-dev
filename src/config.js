require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  baseUrl: process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`,
  
  // Cryptographic signing secret
  hmacSecret: process.env.HMAC_SECRET || 'campus-ticketing-super-secure-secret-key-2026',
  
  // Email Service Configuration
  email: {
    provider: process.env.MAIL_PROVIDER || 'ethereal', // 'smtp' | 'ethereal' | 'console'
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.EMAIL_FROM || '"Campus Event Ticketing" <tickets@campus-events.edu>',
  },

  // Database path
  dbPath: process.env.DB_PATH || './database.sqlite'
};
