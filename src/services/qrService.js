const QRCode = require('qrcode');

/**
 * Service to generate QR codes for digital display and transactional email attachments
 */
class QrService {
  /**
   * Generate QR Code as a Base64 Data URL (image/png)
   * Uses High (H) error correction level (up to 30% damage/glare recovery)
   *
   * @param {string} text - Scannable text or signed cryptographic token
   * @param {Object} options - Customization options
   * @returns {Promise<string>} Data URL
   */
  async generateQrDataUrl(text, options = {}) {
    const defaultOptions = {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.95,
      margin: 2,
      width: options.width || 320,
      color: {
        dark: '#0f172a',  // Slate 900
        light: '#ffffff'  // Pure white background for contrast
      }
    };

    return QRCode.toDataURL(text, { ...defaultOptions, ...options });
  }

  /**
   * Generate QR Code as a raw PNG Buffer for email attachment embedding (MIME CID)
   *
   * @param {string} text - Scannable text or signed cryptographic token
   * @returns {Promise<Buffer>}
   */
  async generateQrBuffer(text) {
    return QRCode.toBuffer(text, {
      errorCorrectionLevel: 'H',
      type: 'png',
      margin: 2,
      width: 400,
      color: {
        dark: '#0a0f1d',
        light: '#ffffff'
      }
    });
  }

  /**
   * Generate QR code as an SVG string for sharp vector rendering
   *
   * @param {string} text
   * @returns {Promise<string>}
   */
  async generateQrSvg(text) {
    return QRCode.toString(text, {
      type: 'svg',
      errorCorrectionLevel: 'H',
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    });
  }
}

module.exports = new QrService();
