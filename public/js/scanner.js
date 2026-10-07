// Organizer Scanner & Verification Portal Logic

let html5QrCode = null;
let currentCameraId = null;
let isScanning = false;
let isProcessingScan = false;
let lastScannedToken = null;
let lastScanTimestamp = 0;
let audioEnabled = true;

// Web Audio API context for zero-latency synthesized sound effects
let audioCtx = null;

document.addEventListener('DOMContentLoaded', async () => {
  initAudio();
  initEventHandlers();
  await loadEventsDropdown();
  await refreshMetricsAndAudit();
  await initWebcamScanner();
});

/**
 * Initialize Web Audio API Synthesizer
 */
function initAudio() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      audioCtx = new AudioContext();
    }
  } catch (e) {
    console.warn('Web Audio not supported:', e);
  }
}

/**
 * Play synthesized audio tones based on scan outcome
 */
function playFeedbackTone(type) {
  if (!audioEnabled || !audioCtx) return;

  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  const now = audioCtx.currentTime;

  if (type === 'success') {
    // Futuristic crisp ascending chime (C5 -> E5 -> G5)
    [523.25, 659.25, 783.99].forEach((freq, idx) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0.18, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.25);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.25);
    });
  } else if (type === 'warning') {
    // Two-tone warning beep for ALREADY USED duplicate entry
    [440, 349.23].forEach((freq, idx) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.14);

      gain.gain.setValueAtTime(0.22, now + idx * 0.14);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.14 + 0.2);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(now + idx * 0.14);
      osc.stop(now + idx * 0.14 + 0.2);
    });
  } else if (type === 'error') {
    // Discordant harsh buzz for INVALID TICKET
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.linearRampToValueAtTime(90, now + 0.35);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.35);
  }
}

/**
 * Setup UI Event Listeners
 */
function initEventHandlers() {
  // Toggle Audio
  const audioBtn = document.getElementById('toggleAudioBtn');
  audioBtn?.addEventListener('click', () => {
    audioEnabled = !audioEnabled;
    const icon = document.getElementById('audioStatusIcon');
    if (audioEnabled) {
      audioBtn.innerHTML = '<span>🔊</span> Audio ON';
      if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    } else {
      audioBtn.innerHTML = '<span>🔇</span> Audio OFF';
    }
  });

  // Event Gate dropdown change
  const eventSelect = document.getElementById('scannerEventSelect');
  eventSelect?.addEventListener('change', () => {
    refreshMetricsAndAudit();
  });

  // Manual Verify submit
  const manualBtn = document.getElementById('manualVerifyBtn');
  const manualInput = document.getElementById('manualTokenInput');
  manualBtn?.addEventListener('click', handleManualVerify);
  manualInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleManualVerify();
  });

  // Camera toggle button
  document.getElementById('toggleCameraBtn')?.addEventListener('click', toggleCameraScanning);

  // Switch camera button
  document.getElementById('restartCameraBtn')?.addEventListener('click', switchCameraDevice);
  document.getElementById('cameraDeviceSelect')?.addEventListener('change', (e) => {
    if (e.target.value) {
      currentCameraId = e.target.value;
      startCameraWithId(currentCameraId);
    }
  });

  // Refresh feed button
  document.getElementById('refreshAuditBtn')?.addEventListener('click', () => {
    refreshMetricsAndAudit();
    showToast('Audit feed updated.', 'info');
  });

  // Quick Test Buttons (Reviewer Test Matrix)
  document.getElementById('btnTestValid')?.addEventListener('click', () => triggerQuickTest('validIssued'));
  document.getElementById('btnTestDuplicate')?.addEventListener('click', () => triggerQuickTest('alreadyUsed'));
  document.getElementById('btnTestTampered')?.addEventListener('click', () => triggerQuickTest('tamperedSignature'));
  document.getElementById('btnTestCounterfeit')?.addEventListener('click', () => triggerQuickTest('malformed'));
}

/**
 * Load events into dropdown
 */
async function loadEventsDropdown() {
  try {
    const res = await fetch('/api/events');
    const data = await res.json();
    if (data.success) {
      const select = document.getElementById('scannerEventSelect');
      if (!select) return;
      select.innerHTML = '<option value="">⚡ All Campus Events</option>' +
        data.data.map(e => `<option value="${e.id}">${e.title} (${e.registered_count}/${e.max_capacity})</option>`).join('');
    }
  } catch (err) {
    console.error('Error loading events for scanner dropdown:', err);
  }
}

/**
 * Initialize Webcam QR Scanner using html5-qrcode
 */
async function initWebcamScanner() {
  const cameraBadge = document.getElementById('cameraStateBadge');
  const deviceSelect = document.getElementById('cameraDeviceSelect');
  const statusText = document.getElementById('scannerStatusText');

  if (typeof Html5Qrcode === 'undefined') {
    if (cameraBadge) {
      cameraBadge.className = 'status-badge invalid_ticket';
      cameraBadge.innerText = '⚠️ Scanner Library Offline';
    }
    return;
  }

  try {
    html5QrCode = new Html5Qrcode('qr-reader');
    const cameras = await Html5Qrcode.getCameras();

    if (!cameras || cameras.length === 0) {
      if (cameraBadge) {
        cameraBadge.className = 'status-badge already_used';
        cameraBadge.innerText = '📷 No Camera Found';
      }
      deviceSelect.innerHTML = '<option value="">No camera detected (Use Manual Fallback)</option>';
      statusText.innerHTML = '⚠️ No webcam found. Use manual input fallback to test.';
      return;
    }

    deviceSelect.innerHTML = cameras.map(cam => `<option value="${cam.id}">${cam.label || `Camera ${cam.id}`}</option>`).join('');
    
    // Choose environment/back camera if available, otherwise first camera
    const backCam = cameras.find(c => c.label.toLowerCase().includes('back') || c.label.toLowerCase().includes('rear') || c.label.toLowerCase().includes('environment'));
    currentCameraId = backCam ? backCam.id : cameras[0].id;
    deviceSelect.value = currentCameraId;

    await startCameraWithId(currentCameraId);

  } catch (err) {
    console.warn('Webcam initialization warning:', err.message);
    if (cameraBadge) {
      cameraBadge.className = 'status-badge already_used';
      cameraBadge.innerText = '📷 Camera Blocked / Preview Mode';
    }
    statusText.innerHTML = 'Camera access blocked or not permitted. Use manual fallback.';
  }
}

/**
 * Start camera feed with a specific device ID
 */
async function startCameraWithId(cameraId) {
  if (!html5QrCode) return;

  const cameraBadge = document.getElementById('cameraStateBadge');
  const toggleBtn = document.getElementById('toggleCameraBtn');
  const statusText = document.getElementById('scannerStatusText');
  const laser = document.getElementById('scannerLaser');

  try {
    if (isScanning) {
      await html5QrCode.stop();
      isScanning = false;
    }

    const config = {
      fps: 15,
      qrbox: { width: 230, height: 230 },
      aspectRatio: 1.333333
    };

    await html5QrCode.start(
      cameraId,
      config,
      onScanSuccess,
      onScanFailure
    );

    isScanning = true;
    if (cameraBadge) {
      cameraBadge.className = 'status-badge checked_in';
      cameraBadge.innerText = '🟢 Camera Active';
    }
    if (toggleBtn) toggleBtn.innerText = 'Pause Camera';
    if (laser) laser.style.display = 'block';
    if (statusText) statusText.innerHTML = '<span class="status-dot"></span> Active Viewfinder • Ready to scan';

  } catch (err) {
    console.error('Camera start error:', err);
    if (cameraBadge) {
      cameraBadge.className = 'status-badge already_used';
      cameraBadge.innerText = '📷 Camera Inactive';
    }
    if (toggleBtn) toggleBtn.innerText = 'Start Camera';
    if (laser) laser.style.display = 'none';
  }
}

/**
 * Pause / Resume camera scanner
 */
async function toggleCameraScanning() {
  if (!html5QrCode) return;
  const toggleBtn = document.getElementById('toggleCameraBtn');
  const cameraBadge = document.getElementById('cameraStateBadge');
  const laser = document.getElementById('scannerLaser');
  const statusText = document.getElementById('scannerStatusText');

  if (isScanning) {
    await html5QrCode.stop();
    isScanning = false;
    toggleBtn.innerText = 'Resume Camera';
    cameraBadge.className = 'status-badge already_used';
    cameraBadge.innerText = '⏸️ Camera Paused';
    if (laser) laser.style.display = 'none';
    statusText.innerText = 'Camera paused. Click Resume to scan.';
  } else if (currentCameraId) {
    await startCameraWithId(currentCameraId);
  }
}

/**
 * Switch camera device
 */
async function switchCameraDevice() {
  const select = document.getElementById('cameraDeviceSelect');
  if (!select || select.options.length < 2) {
    showToast('Only 1 camera available on this device.', 'info');
    return;
  }
  const currentIndex = select.selectedIndex;
  const nextIndex = (currentIndex + 1) % select.options.length;
  select.selectedIndex = nextIndex;
  currentCameraId = select.value;
  await startCameraWithId(currentCameraId);
}

/**
 * QR Code Detected by Webcam
 */
async function onScanSuccess(decodedText) {
  const now = Date.now();
  // Cooldown prevention: don't process identical token within 3 seconds
  if (isProcessingScan) return;
  if (decodedText === lastScannedToken && (now - lastScanTimestamp) < 3000) {
    return;
  }

  isProcessingScan = true;
  lastScannedToken = decodedText;
  lastScanTimestamp = now;

  console.log('📷 QR Scanned:', decodedText.substring(0, 30) + '...');

  // Visual scan pulse
  const overlay = document.querySelector('.reticle-box');
  if (overlay) {
    overlay.style.boxShadow = '0 0 25px #38bdf8, 0 0 0 4000px rgba(0, 0, 0, 0.45)';
    setTimeout(() => {
      overlay.style.boxShadow = '0 0 0 4000px rgba(0, 0, 0, 0.45)';
    }, 400);
  }

  await executeVerification({
    token: decodedText,
    isQrToken: true
  });

  setTimeout(() => {
    isProcessingScan = false;
  }, 1200);
}

function onScanFailure(error) {
  // Silent frame miss (normal during video capture when no QR is present in frame)
}

/**
 * Handle Manual Token or Ticket Code Entry
 */
async function handleManualVerify() {
  const input = document.getElementById('manualTokenInput');
  const rawVal = input.value.trim();

  if (!rawVal) {
    showToast('Please paste a token or enter a ticket code.', 'warning');
    return;
  }

  const isFullToken = rawVal.includes('.');

  await executeVerification({
    token: rawVal,
    isQrToken: isFullToken,
    manualCode: isFullToken ? null : rawVal
  });
}

/**
 * Central Verification Request Processor
 */
async function executeVerification({ token, isQrToken, manualCode }) {
  const eventId = document.getElementById('scannerEventSelect').value;
  const banner = document.getElementById('hudBanner');
  const lastScanTime = document.getElementById('lastScanTime');

  lastScanTime.innerText = new Date().toLocaleTimeString();

  // Indicate loading state
  banner.className = 'hud-banner idle';
  document.getElementById('hudBadge').className = 'hud-badge idle';
  document.getElementById('hudBadge').innerText = 'VERIFYING...';
  document.getElementById('hudHeadline').innerText = 'Issuing backend verification query...';

  try {
    let response;

    if (isQrToken) {
      // POST /api/verify/scan
      response = await fetch('/api/verify/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          eventId: eventId || null,
          scannerDevice: 'Gate 1 Webcam Scanner'
        })
      });
    } else {
      // POST /api/verify/manual
      response = await fetch('/api/verify/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketCode: manualCode || token,
          eventId: eventId || null,
          scannerDevice: 'Gate 1 Manual Fallback'
        })
      });
    }

    const data = await response.json();
    renderVerificationResult(data);

    // Refresh KPI strip and live audit logs
    await refreshMetricsAndAudit();

  } catch (err) {
    console.error('Verification error:', err);
    renderVerificationResult({
      status: 'SERVER_ERROR',
      alertType: 'error',
      badge: 'ERROR',
      reason: 'Network or server communication failure during check-in.'
    });
  }
}

/**
 * Render HUD Result Card based on verification payload
 */
function renderVerificationResult(data) {
  const banner = document.getElementById('hudBanner');
  const badge = document.getElementById('hudBadge');
  const headline = document.getElementById('hudHeadline');
  const subtext = document.getElementById('hudSubtext');
  const detailsGrid = document.getElementById('attendeeDetailsGrid');

  const { status, attendee, checkedInAt, originalCheckInTime, reason, message } = data;

  if (status === 'CHECKED_IN') {
    // 🟢 CASE 1: First valid scan -> CHECKED-IN
    banner.className = 'hud-banner success';
    badge.className = 'hud-badge success';
    badge.innerText = '🟢 CHECKED-IN';
    headline.innerText = message || 'Entry Pass Validated Successfully!';
    subtext.innerText = 'Attendee confirmed in venue database. Welcome!';

    playFeedbackTone('success');
    showToast(`Checked in: ${attendee.name}`, 'success');

    // Populate attendee details
    detailsGrid.style.display = 'grid';
    document.getElementById('hudStudentName').innerText = attendee.name;
    document.getElementById('hudStudentId').innerText = attendee.studentId;
    document.getElementById('hudDepartment').innerText = attendee.department || 'N/A';
    document.getElementById('hudTicketCode').innerText = data.ticketCode || attendee.ticket_code;
    document.getElementById('hudEventTitle').innerText = attendee.eventTitle || 'Campus Event';
    document.getElementById('hudScanTimestamp').innerText = `Checked in just now (${new Date(checkedInAt).toLocaleTimeString()})`;

  } else if (status === 'ALREADY_USED') {
    // 🟡 CASE 2: Duplicate scan -> ALREADY USED with original timestamp
    banner.className = 'hud-banner warning';
    badge.className = 'hud-badge warning';
    badge.innerText = '🟡 ALREADY USED';
    headline.innerText = 'Duplicate Entry Flagged!';

    const timeFormatted = originalCheckInTime ? new Date(originalCheckInTime).toLocaleTimeString() : 'Previously';
    subtext.innerText = `This ticket was already checked in at ${timeFormatted}. Prevent double-entry!`;

    playFeedbackTone('warning');
    showToast('Warning: Ticket already used!', 'warning');

    if (attendee) {
      detailsGrid.style.display = 'grid';
      document.getElementById('hudStudentName').innerText = attendee.name;
      document.getElementById('hudStudentId').innerText = attendee.studentId;
      document.getElementById('hudDepartment').innerText = attendee.department || 'N/A';
      document.getElementById('hudTicketCode').innerText = data.ticketCode || attendee.ticket_code;
      document.getElementById('hudEventTitle').innerText = attendee.eventTitle || 'Campus Event';
      document.getElementById('hudScanTimestamp').innerText = `Initial Check-in: ${new Date(originalCheckInTime).toLocaleString()}`;
    } else {
      detailsGrid.style.display = 'none';
    }

  } else {
    // 🔴 CASE 3: INVALID TICKET (Tampered signature or unrecognized format)
    banner.className = 'hud-banner error';
    badge.className = 'hud-badge error';
    badge.innerText = '🔴 INVALID TICKET';
    headline.innerText = 'Security Verification Failed!';
    subtext.innerText = reason || 'Cryptographic signature mismatch or counterfeit ticket.';

    playFeedbackTone('error');
    showToast('Invalid ticket alert!', 'error');

    if (attendee) {
      detailsGrid.style.display = 'grid';
      document.getElementById('hudStudentName').innerText = attendee.name;
      document.getElementById('hudStudentId').innerText = '-';
      document.getElementById('hudDepartment').innerText = '-';
      document.getElementById('hudTicketCode').innerText = data.ticketCode || '-';
      document.getElementById('hudEventTitle').innerText = attendee.eventTitle || 'Wrong Gate Event';
      document.getElementById('hudScanTimestamp').innerText = 'Rejected';
    } else {
      detailsGrid.style.display = 'none';
    }
  }
}

/**
 * Refresh KPI metrics strip and scan audit table
 */
async function refreshMetricsAndAudit() {
  const eventId = document.getElementById('scannerEventSelect')?.value;

  try {
    // 1. Fetch KPI metrics
    if (eventId) {
      const res = await fetch(`/api/events/${eventId}`);
      const evtData = await res.json();
      if (evtData.success) {
        const e = evtData.data;
        const attendeesRes = await fetch(`/api/admin/attendees/${eventId}`);
        const attData = await attendeesRes.json();
        const checkedInCount = attData.data ? attData.data.filter(a => a.status === 'CHECKED_IN').length : 0;

        document.getElementById('kpiRegistered').innerText = `${e.registered_count} / ${e.max_capacity}`;
        document.getElementById('kpiCheckedIn').innerText = checkedInCount;
        document.getElementById('kpiRemaining').innerText = e.registered_count - checkedInCount;
        const rate = e.registered_count > 0 ? Math.round((checkedInCount / e.registered_count) * 100) : 0;
        document.getElementById('kpiAttendanceRate').innerText = `${rate}%`;
      }
    } else {
      const statsRes = await fetch('/api/admin/stats');
      const statsData = await statsRes.json();
      if (statsData.success) {
        const s = statsData.stats;
        document.getElementById('kpiRegistered').innerText = `${s.totalTickets} Passes`;
        document.getElementById('kpiCheckedIn').innerText = s.totalCheckedIn;
        document.getElementById('kpiRemaining').innerText = s.totalPending;
        document.getElementById('kpiAttendanceRate').innerText = `${s.overallAttendanceRate}%`;
      }
    }

    // 2. Fetch live scan logs
    const url = eventId ? `/api/admin/scans?eventId=${eventId}&limit=20` : '/api/admin/scans?limit=20';
    const scansRes = await fetch(url);
    const scansData = await scansRes.json();

    const tbody = document.getElementById('auditTableBody');
    if (!tbody) return;

    if (!scansData.success || scansData.data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-subtle); padding: 2rem;">No scans recorded yet. Present a QR code to begin.</td></tr>';
      return;
    }

    tbody.innerHTML = scansData.data.map(log => {
      let badgeClass = 'invalid_ticket';
      let badgeText = 'INVALID TICKET';
      if (log.result_status === 'CHECKED_IN') {
        badgeClass = 'checked_in';
        badgeText = 'CHECKED-IN';
      } else if (log.result_status === 'ALREADY_USED') {
        badgeClass = 'already_used';
        badgeText = 'ALREADY USED';
      }

      const timeStr = new Date(log.scan_timestamp).toLocaleTimeString();

      return `
        <tr>
          <td class="mono" style="color: var(--text-muted);">${timeStr}</td>
          <td><span class="status-badge ${badgeClass}">${badgeText}</span></td>
          <td><strong>${log.student_name || 'Anonymous / Counterfeit'}</strong></td>
          <td class="mono" style="color: #38bdf8;">${log.ticket_code || '-'}</td>
          <td style="color: #cbd5e1; font-size: 0.8rem;">${log.reason || '-'}</td>
          <td style="color: var(--text-subtle); font-size: 0.75rem;">${log.scanner_device || 'Webcam'}</td>
        </tr>
      `;
    }).join('');

  } catch (err) {
    console.error('Metrics/Audit refresh error:', err);
  }
}

/**
 * Reviewer Quick-Test Matrix Action
 */
async function triggerQuickTest(scenarioKey) {
  // Use event 1 (HackSphere 2026) for demo test scenarios
  let eventId = document.getElementById('scannerEventSelect')?.value || '1';

  try {
    const res = await fetch(`/api/admin/test-scenarios/${eventId}`);
    const data = await res.json();

    if (!data.success || !data.scenarios[scenarioKey]) {
      showToast('Could not fetch test scenario data.', 'error');
      return;
    }

    const scenario = data.scenarios[scenarioKey];
    if (!scenario.token) {
      showToast('No matching ticket in this state. Try resetting demo data in Admin hub.', 'warning');
      return;
    }

    // Populate manual input box for visual clarity
    const input = document.getElementById('manualTokenInput');
    if (input) input.value = scenario.token;

    showToast(`Executing Quick Test: ${scenario.label}`, 'info');

    await executeVerification({
      token: scenario.token,
      isQrToken: true
    });

  } catch (err) {
    console.error('Quick test error:', err);
    showToast('Failed to execute test scenario.', 'error');
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
