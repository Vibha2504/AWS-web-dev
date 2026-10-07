const crypto = require('crypto');
const config = require('../config');

/**
 * Service handling cryptographic signing and verification of campus ticket tokens.
 * Uses HMAC-SHA256 with timing-safe comparison to prevent forgery and timing attacks.
 */
class CryptoService {
  constructor(secret = config.hmacSecret) {
    this.secret = secret;
  }

  /**
   * Generates a cryptographically signed ticket token
   * Format: <base64url_payload>.<base64url_hmac_sha256_signature>
   *
   * @param {Object} data - Ticket payload data
   * @returns {string} Signed token
   */
  generateTicketToken(data) {
    const payload = {
      eventId: data.eventId,
      ticketCode: data.ticketCode,
      studentId: data.studentId,
      studentEmail: data.studentEmail,
      issuedAt: data.issuedAt || Date.now(),
      nonce: crypto.randomBytes(8).toString('hex') // Unique entropy
    };

    const payloadString = JSON.stringify(payload);
    const payloadB64 = Buffer.from(payloadString, 'utf-8').toString('base64url');

    const signature = crypto
      .createHmac('sha256', this.secret)
      .update(payloadB64)
      .digest('base64url');

    return `${payloadB64}.${signature}`;
  }

  /**
   * Cryptographically verifies a scanned token.
   * Ensures the token was minted by this server and has not been tampered with.
   *
   * @param {string} rawToken - Scanned QR token
   * @returns {{ valid: boolean, payload?: Object, reason?: string }}
   */
  verifyTicketToken(rawToken) {
    if (!rawToken || typeof rawToken !== 'string') {
      return { valid: false, reason: 'Empty or non-string token provided.' };
    }

    const parts = rawToken.trim().split('.');
    if (parts.length !== 2) {
      return {
        valid: false,
        reason: 'Malformed token structure. Expected <payload>.<signature> format.'
      };
    }

    const [payloadB64, signature] = parts;

    // Recalculate HMAC-SHA256 signature
    const expectedSignature = crypto
      .createHmac('sha256', this.secret)
      .update(payloadB64)
      .digest('base64url');

    // Use constant-time buffer comparison to prevent timing attacks
    const sigBuffer = Buffer.from(signature, 'utf-8');
    const expectedBuffer = Buffer.from(expectedSignature, 'utf-8');

    if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
      return {
        valid: false,
        reason: 'Cryptographic signature mismatch. Ticket token is counterfeit or tampered with.'
      };
    }

    // Decode and parse payload
    try {
      const decodedJson = Buffer.from(payloadB64, 'base64url').toString('utf-8');
      const payload = JSON.parse(decodedJson);

      if (!payload.ticketCode || !payload.eventId) {
        return {
          valid: false,
          reason: 'Token payload missing required ticketCode or eventId fields.'
        };
      }

      return {
        valid: true,
        payload
      };
    } catch (err) {
      return {
        valid: false,
        reason: 'Failed to decode token JSON payload.'
      };
    }
  }

  /**
   * Helper to generate a counterfeit/tampered version of a valid token for reviewer testing
   * @param {string} validToken
   * @returns {string} Tampered token
   */
  createTamperedToken(validToken) {
    if (!validToken || !validToken.includes('.')) {
      return 'TAMPERED_INVALID_TOKEN_FORGED_12345';
    }
    const [payload, sig] = validToken.split('.');
    // Flip the first character of the signature
    const corruptedSig = (sig[0] === 'a' ? 'b' : 'a') + sig.slice(1);
    return `${payload}.${corruptedSig}`;
  }
}

module.exports = new CryptoService();
