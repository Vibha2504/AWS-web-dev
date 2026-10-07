# 🎟️ CampusPass — University Event Ticketing & QR Check-In System

[![Node.js](https://img.shields.io/badge/Node.js-v20%2B-green.svg)](https://nodejs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16%20(Turbopack)-black.svg)](https://nextjs.org/)
[![Security](https://img.shields.io/badge/Crypto-HMAC--SHA256%20Timing--Safe-blue.svg)]()
[![Database](https://img.shields.io/badge/SQLite-WAL%20Mode-orange.svg)]()
[![Tests](https://img.shields.io/badge/Tests-Passing%20(100%25)-brightgreen.svg)]()

> **Submission for Web Development Club Induction (Project WEB-04)**  
> Built as an enterprise-grade campus event ticketing platform featuring real-time venue capacity management, cryptographically signed QR admission passes, automated transactional email dispatch, and an organizer webcam verification portal with anti-duplication security.

---

## 🌟 Key Features

* **Participant Registration Portal (`/events`)**:
  * Real-time venue capacity display with dynamic progress bar (`registered / max_capacity`).
  * Strict capacity limits: Submissions are rejected with HTTP `409 Conflict` once capacity is filled.
  * Instant on-screen boarding-pass digital ticket generation.
* **Transactional Email Dispatch Engine**:
  * Generates and dispatches dynamic HTML ticket passes with embedded QR code.
  * Uses MIME inline CID attachments (`cid:ticketqr`) for zero-friction rendering in Gmail/Outlook.
  * Multi-provider support: Resend, SendGrid, Brevo, AWS SES, Gmail SMTP, and auto-provisioned Ethereal sandbox previews.
* **Organizer Scan & Verification Portal (`/organizer/scan`)**:
  * Integrated in-browser webcam scanner with active targeting reticle and animated laser scan line.
  * Manual token/code input fallback for damaged mobile screens or testing without a camera.
  * Rapid 1-click test simulation buttons: **Valid Ticket**, **Duplicate Scan**, **Tampered Signature**, **Counterfeit Token**.
* **Check-In & Anti-Duplication Security**:
  * **First Valid Scan**: Marks attendee as `CHECKED-IN` with timestamp.
  * **Subsequent Scans**: Automatically flagged as `ALREADY USED` showing original check-in timestamp.
  * **Tampered/Counterfeit Tokens**: Instantly rejected as `INVALID TICKET` via constant-time HMAC-SHA256 verification.
* **Organizer Dashboard & Management (`/organizer`)**:
  * 5 KPI Telemetry Cards: Total Events, Registrations, Checked In, Remaining, Attendance Rate.
  * Event Management (`/organizer/events`) and Event Creator (`/organizer/events/new`).
  * Attendee Registrations Roster (`/organizer/registrations`) and Live Gate Audit Log (`/organizer/check-ins`).

---

## 🏗️ Architecture & Tech Stack

| Layer | Technologies Used |
| :--- | :--- |
| **Frontend App** | Next.js 16 (App Router, Turbopack), TypeScript, Tailwind CSS, shadcn/ui, Lucide React, SWR |
| **Backend API** | Node.js, Express.js, CORS |
| **Cryptographic Security** | Node.js `crypto` (HMAC-SHA256, `crypto.timingSafeEqual`) |
| **QR Code Engine** | `qrcode`, `qrcode.react`, `jsQR` (Reed-Solomon Level H Error Correction) |
| **Transactional Mailer** | Nodemailer (SMTP Relay + MIME CID Multipart Attachments + Ethereal Preview) |
| **Database** | SQLite3 in Write-Ahead Logging (WAL) Mode with atomic SQL locks |

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `PORT` | Backend server port | `3000` |
| `HMAC_SECRET` | Cryptographic secret for QR signatures | `campus-ticketing-super-secure-secret-key-2026` |
| `MAIL_PROVIDER` | Mailer mode (`ethereal` or `smtp`) | `ethereal` |
| `SMTP_HOST` | Third-party SMTP host | `smtp.resend.com` / `smtp.sendgrid.net` / `smtp-relay.brevo.com` |
| `SMTP_PORT` | SMTP port | `587` or `465` |
| `SMTP_SECURE` | SSL/TLS boolean | `false` (for 587) or `true` (for 465) |
| `SMTP_USER` | SMTP username / API key identity | `resend` / `apikey` / your email |
| `SMTP_PASS` | SMTP password / API token | `re_xxx` / `SG.xxx` |
| `EMAIL_FROM` | Sender display name and address | `"Campus Events" <tickets@campus.edu>` |
| `DB_PATH` | SQLite file location | `./database.sqlite` |

---

## 🚀 Local Execution Steps

### 1. Run Backend Engine & Automated Test Suite

```bash
# In project root
npm install

# Run automated integration tests (validates capacity, crypto, duplicates)
npm test

# Launch backend server
npm start
# -> Backend active at http://localhost:3000
```

### 2. Run Modern Next.js Frontend

```bash
cd Frontend
npm install

# Production build verification
npm run build

# Start dev server on port 3001
npm run dev -- -p 3001
# -> Frontend active at http://localhost:3001
```

---

## 🧪 How to Test the Organizer Scan Workflow Locally

You can test the entire workflow locally in under 2 minutes:

### Method 1: Using the Next.js Frontend Portal (`http://localhost:3001`)

1. Open `http://localhost:3001/events` and browse the campus events.
2. Click **HackSprint 2026**, fill in your details, and submit.
3. Observe the generated **Digital Ticket Pass** with the QR code and ticket ID.
4. Navigate to the **Gate Scanner**: `http://localhost:3001/organizer/scan`.
5. Point your camera at the pass, or use the **1-Click Test Matrix**:
   * Click **[🟢 Test Valid Ticket]** $\rightarrow$ Banner turns green: **`CHECKED-IN`** with attendee name and chime.
   * Click **[🟡 Test Duplicate Scan]** $\rightarrow$ Banner turns amber: **`ALREADY USED`** with original timestamp.
   * Click **[🔴 Test Tampered]** $\rightarrow$ Banner turns red: **`INVALID TICKET`** (signature mismatch).
6. View the live telemetry update in the **Gate Audit Trail** (`/organizer/check-ins`).

### Method 2: Command-Line Integration Tests

Run the headless integration test suite:

```bash
npm test
```

Expected output:
```text
✅ Test 1: Seeded events verified (4 active campus events).
✅ Test 2: Capacity Limit Enforcement passed (Excess registrations rejected with CAPACITY_REACHED).
✅ Test 3: Cryptographic signature validation & tamper detection passed.
✅ Test 4: First scan marks attendee as CHECKED-IN.
✅ Test 5: Duplicate scan flagged as ALREADY USED (Original check-in timestamp reported).
✅ Test 6: Unknown or counterfeit ticket flagged as INVALID TICKET.
✅ Test 7: Scan audit trail recorded successfully.
🎉 ALL 7 SYSTEM INTEGRATION TESTS PASSED WITH 100% SUCCESS!
```

---

## 📖 Technical Handbook

For full architectural breakdowns, mathematical cryptographic formulas, concurrency race condition analysis, and sample interview questions, refer to:

👉 **[TECHNICAL_HANDBOOK.md](./TECHNICAL_HANDBOOK.md)**
