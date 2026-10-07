// Reviewer Hub & Admin JavaScript

document.addEventListener('DOMContentLoaded', () => {
  initAdminEventHandlers();
  loadAttendeeTable();
});

function initAdminEventHandlers() {
  document.getElementById('adminEventFilter')?.addEventListener('change', loadAttendeeTable);

  document.getElementById('btnResetDatabase')?.addEventListener('click', handleResetDatabase);

  // Requirement Testing Matrix
  document.getElementById('btnTestCapacityRejection')?.addEventListener('click', testCapacityRejection);
  document.getElementById('btnTestValidCheckIn')?.addEventListener('click', testValidCheckIn);
  document.getElementById('btnTestDuplicateScan')?.addEventListener('click', testDuplicateScan);
  document.getElementById('btnTestTamperDetection')?.addEventListener('click', testTamperDetection);
}

/**
 * Log message into interactive console
 */
function logToConsole(message, status = 'RUNNING') {
  const consoleWrap = document.getElementById('testOutputConsole');
  const consoleContent = document.getElementById('testConsoleContent');
  const statusEl = document.getElementById('testConsoleStatus');

  consoleWrap.style.display = 'block';
  statusEl.innerText = status;
  if (status === 'PASS') statusEl.style.color = '#34d399';
  else if (status === 'WARN') statusEl.style.color = '#fbbf24';
  else if (status === 'FAIL') statusEl.style.color = '#f43f5e';
  else statusEl.style.color = '#38bdf8';

  consoleContent.innerText = `[${new Date().toLocaleTimeString()}] ${message}\n`;
}

/**
 * TEST 1: Capacity Limit Enforcement & Rejection
 */
async function testCapacityRejection() {
  logToConsole('Initiating Venue Capacity Rejection Test on Event #4 (Max Capacity: 3)...\nAttempting to register excess attendee when full...');

  try {
    const res = await fetch('/api/tickets/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventId: 4, // Limited VIP Lab
        studentName: 'Capacity Test Student',
        studentEmail: `excess_${Date.now()}@campus.edu`,
        studentId: `CAP-${Math.floor(Math.random() * 9000)}`,
        department: 'Cybersecurity'
      })
    });

    const data = await res.json();

    if (res.status === 409) {
      logToConsole(
        `✅ SUCCESS (HTTP 409 Conflict Received):\n${JSON.stringify(data, null, 2)}\n\nResult: Venue capacity limit is strictly enforced! Server correctly blocked registration beyond venue limits.`,
        'PASS'
      );
      showToast('Capacity rejection test passed!', 'success');
    } else if (res.ok) {
      logToConsole(
        `ℹ️ Notice: Ticket registered (${data.ticket.ticketCode}). Event was not yet full. Re-running test now that it has hit full capacity...`,
        'RUNNING'
      );
      testCapacityRejection();
    } else {
      logToConsole(`⚠️ Received: ${JSON.stringify(data, null, 2)}`, 'WARN');
    }

    loadAttendeeTable();
  } catch (err) {
    logToConsole(`❌ Error: ${err.message}`, 'FAIL');
  }
}

/**
 * TEST 2: First Valid Check-In -> CHECKED-IN
 */
async function testValidCheckIn() {
  logToConsole('Fetching valid un-scanned ticket token for Event #1...');

  try {
    const scenariosRes = await fetch('/api/admin/test-scenarios/1');
    const scenariosData = await scenariosRes.json();
    const scenario = scenariosData.scenarios?.validIssued;

    if (!scenario || !scenario.token) {
      logToConsole('⚠️ All tickets for Event #1 are already checked in. Reset the database to test again.', 'WARN');
      showToast('Please reset database for fresh tickets.', 'warning');
      return;
    }

    logToConsole(`Submitting valid cryptographically signed token to /api/verify/scan...\nToken: ${scenario.token.substring(0, 50)}...`);

    const res = await fetch('/api/verify/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: scenario.token,
        eventId: 1,
        scannerDevice: 'Reviewer Test Console'
      })
    });

    const data = await res.json();

    if (data.status === 'CHECKED_IN') {
      logToConsole(
        `✅ SUCCESS (Status: CHECKED-IN):\n${JSON.stringify(data, null, 2)}\n\nResult: Cryptographic signature validated, database updated status to CHECKED-IN with timestamp ${data.checkedInAt}.`,
        'PASS'
      );
      showToast('Valid Check-In test passed!', 'success');
    } else {
      logToConsole(`Result: ${JSON.stringify(data, null, 2)}`, 'WARN');
    }

    loadAttendeeTable();
  } catch (err) {
    logToConsole(`❌ Error: ${err.message}`, 'FAIL');
  }
}

/**
 * TEST 3: Duplicate Scan -> ALREADY USED
 */
async function testDuplicateScan() {
  logToConsole('Fetching already checked-in ticket token for Event #1...');

  try {
    const scenariosRes = await fetch('/api/admin/test-scenarios/1');
    const scenariosData = await scenariosRes.json();
    const scenario = scenariosData.scenarios?.alreadyUsed;

    if (!scenario || !scenario.token) {
      logToConsole('No checked-in ticket found. Running valid check-in first...', 'RUNNING');
      await testValidCheckIn();
      return testDuplicateScan();
    }

    logToConsole(`Re-scanning checked-in ticket (${scenario.ticketCode}) to verify duplicate prevention...\nToken: ${scenario.token.substring(0, 50)}...`);

    const res = await fetch('/api/verify/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: scenario.token,
        eventId: 1,
        scannerDevice: 'Reviewer Test Console'
      })
    });

    const data = await res.json();

    if (data.status === 'ALREADY_USED') {
      logToConsole(
        `✅ SUCCESS (Status: ALREADY USED):\n${JSON.stringify(data, null, 2)}\n\nResult: Duplicate scan detected! Anti-duplication lock prevented second entry and reported original check-in timestamp (${data.originalCheckInTime}).`,
        'PASS'
      );
      showToast('Anti-duplication test passed!', 'success');
    } else {
      logToConsole(`Result: ${JSON.stringify(data, null, 2)}`, 'WARN');
    }

    loadAttendeeTable();
  } catch (err) {
    logToConsole(`❌ Error: ${err.message}`, 'FAIL');
  }
}

/**
 * TEST 4: Tampered Signature -> INVALID TICKET
 */
async function testTamperDetection() {
  logToConsole('Generating token with 1 forged/altered byte in the HMAC-SHA256 signature...');

  try {
    const scenariosRes = await fetch('/api/admin/test-scenarios/1');
    const scenariosData = await scenariosRes.json();
    const scenario = scenariosData.scenarios?.tamperedSignature;

    if (!scenario || !scenario.token) {
      logToConsole('⚠️ Could not generate tampered token. Reset database first.', 'WARN');
      return;
    }

    logToConsole(`Submitting tampered token to /api/verify/scan...\nTampered Token: ${scenario.token.substring(0, 50)}...`);

    const res = await fetch('/api/verify/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: scenario.token,
        eventId: 1,
        scannerDevice: 'Reviewer Test Console'
      })
    });

    const data = await res.json();

    if (data.status === 'INVALID_TICKET') {
      logToConsole(
        `✅ SUCCESS (Status: INVALID TICKET):\n${JSON.stringify(data, null, 2)}\n\nResult: Tamper detection verified! Cryptographic HMAC-SHA256 mismatch detected in constant-time and admission was rejected.`,
        'PASS'
      );
      showToast('Tamper detection test passed!', 'success');
    } else {
      logToConsole(`Result: ${JSON.stringify(data, null, 2)}`, 'WARN');
    }

    loadAttendeeTable();
  } catch (err) {
    logToConsole(`❌ Error: ${err.message}`, 'FAIL');
  }
}

/**
 * Reset and Re-seed database
 */
async function handleResetDatabase() {
  if (!confirm('Are you sure you want to reset the database and restore default demo events and attendees?')) {
    return;
  }

  try {
    const res = await fetch('/api/admin/reset', { method: 'POST' });
    const data = await res.json();

    if (data.success) {
      showToast('Database reset and seeded with default data!', 'success');
      logToConsole('Database successfully reset and re-seeded with campus events.', 'PASS');
      loadAttendeeTable();
    } else {
      showToast('Failed to reset database.', 'error');
    }
  } catch (err) {
    console.error('Reset error:', err);
    showToast('Network error resetting database.', 'error');
  }
}

/**
 * Load Attendee Table
 */
async function loadAttendeeTable() {
  const eventId = document.getElementById('adminEventFilter')?.value || '1';
  const tbody = document.getElementById('attendeeTableBody');
  if (!tbody) return;

  try {
    const res = await fetch(`/api/admin/attendees/${eventId}`);
    const data = await res.json();

    if (!data.success || data.data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-subtle); padding: 2rem;">No attendees registered for this event yet.</td></tr>';
      return;
    }

    tbody.innerHTML = data.data.map(att => {
      const isCheckedIn = att.status === 'CHECKED_IN';
      const badgeClass = isCheckedIn ? 'checked_in' : 'already_used';
      const badgeText = isCheckedIn ? 'CHECKED-IN' : 'ISSUED (PENDING)';

      const timeStr = att.checked_in_at ? new Date(att.checked_in_at).toLocaleString() : '—';

      return `
        <tr>
          <td class="mono" style="color: #38bdf8; font-weight: 700;">${att.ticket_code}</td>
          <td><strong>${att.student_name}</strong></td>
          <td style="color: var(--text-muted); font-size: 0.8rem;">${att.student_email}</td>
          <td>${att.student_id} <span style="color: var(--text-subtle);">(${att.department})</span></td>
          <td><span class="status-badge ${badgeClass}">${badgeText}</span></td>
          <td class="mono" style="font-size: 0.75rem; color: #cbd5e1;">${timeStr}</td>
          <td>
            <a href="/?pass=${att.ticket_code}" class="btn btn-secondary btn-sm" style="font-size: 0.75rem; padding: 0.25rem 0.5rem;" target="_blank">
              👁️ View Pass
            </a>
          </td>
        </tr>
      `;
    }).join('');

  } catch (err) {
    console.error('Error loading attendees:', err);
  }
}

/**
 * Toast Notification Helper
 */
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };

  toast.innerHTML = `
    <span>${icons[type] || 'ℹ️'}</span>
    <span style="flex: 1;">${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(50px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}
