// Participant Portal Frontend Logic

let allEvents = [];
let currentFilter = 'ALL';
let currentSearchTerm = '';

document.addEventListener('DOMContentLoaded', () => {
  initEventListeners();
  loadEvents();

  // Check URL query parameters for ?pass=TKT-XXXX
  const urlParams = new URLSearchParams(window.location.search);
  const passCode = urlParams.get('pass');
  if (passCode) {
    document.getElementById('lookupTicketCode').value = passCode;
    handleLookupPass();
  }
});

function initEventListeners() {
  // Category filters
  const filterBtns = document.querySelectorAll('.cat-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.category;
      renderEvents();
    });
  });

  // Search input
  const searchInput = document.getElementById('eventSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentSearchTerm = e.target.value.toLowerCase().trim();
      renderEvents();
    });
  }

  // Close modals
  document.getElementById('closeRegModalBtn')?.addEventListener('click', closeRegistrationModal);
  document.getElementById('closePassModalBtn')?.addEventListener('click', () => {
    document.getElementById('ticketPassModal').classList.remove('active');
  });
  document.getElementById('closeFindPassModalBtn')?.addEventListener('click', () => {
    document.getElementById('findPassModal').classList.remove('active');
  });

  // Find My Pass Nav Button
  document.getElementById('findPassNavBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('findPassModal').classList.add('active');
    document.getElementById('lookupTicketCode').focus();
  });

  // Lookup submit
  document.getElementById('executeLookupBtn')?.addEventListener('click', handleLookupPass);
  document.getElementById('lookupTicketCode')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleLookupPass();
  });

  // Registration Form Submit
  const regForm = document.getElementById('registrationForm');
  if (regForm) {
    regForm.addEventListener('submit', handleRegistrationSubmit);
  }

  // Copy Ticket Code Button
  document.getElementById('copyCodeBtn')?.addEventListener('click', () => {
    const code = document.getElementById('passTicketCode').innerText;
    navigator.clipboard.writeText(code).then(() => {
      showToast('Ticket code copied to clipboard!', 'success');
    }).catch(() => {
      showToast('Could not copy code.', 'warning');
    });
  });

  // Download Pass Button
  document.getElementById('downloadPassBtn')?.addEventListener('click', () => {
    const qrImg = document.getElementById('passQrImg');
    const ticketCode = document.getElementById('passTicketCode').innerText;
    if (qrImg && qrImg.src) {
      const a = document.createElement('a');
      a.href = qrImg.src;
      a.download = `${ticketCode}-entry-pass.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast('QR Pass downloaded!', 'success');
    }
  });

  // Close modals on background click
  window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
      e.target.classList.remove('active');
    }
  });
}

/**
 * Fetch events from API
 */
async function loadEvents() {
  try {
    const res = await fetch('/api/events');
    const data = await res.json();
    if (data.success) {
      allEvents = data.data;
      renderEvents();
    } else {
      showToast('Failed to load events.', 'error');
    }
  } catch (err) {
    console.error('Error fetching events:', err);
    showToast('Network error loading events.', 'error');
  }
}

/**
 * Render filtered events into cards grid
 */
function renderEvents() {
  const container = document.getElementById('eventsGridContainer');
  if (!container) return;

  let filtered = allEvents;

  if (currentFilter !== 'ALL') {
    filtered = filtered.filter(e => e.category.toLowerCase() === currentFilter.toLowerCase());
  }

  if (currentSearchTerm) {
    filtered = filtered.filter(e => 
      e.title.toLowerCase().includes(currentSearchTerm) ||
      e.description.toLowerCase().includes(currentSearchTerm) ||
      e.location.toLowerCase().includes(currentSearchTerm)
    );
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem; color: var(--text-muted);">
        <p style="font-size: 1.1rem;">🔍 No campus events found matching your criteria.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(event => {
    const percent = Math.min(100, Math.round((event.registered_count / event.max_capacity) * 100));
    const isFull = event.registered_count >= event.max_capacity;
    const isNearFull = !isFull && (event.max_capacity - event.registered_count <= 5);

    let barClass = '';
    if (isFull) barClass = 'full';
    else if (isNearFull || percent >= 75) barClass = 'warning';

    const formattedDate = new Date(event.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    return `
      <div class="event-card ${isFull ? 'sold-out' : ''}">
        <div class="event-banner-wrap">
          <img class="event-banner-img" src="${event.banner_url || 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800'}" alt="${event.title}">
          <div class="event-banner-overlay"></div>
          <span class="event-category-badge">${event.category}</span>
          ${isFull ? '<span class="event-soldout-badge">SOLD OUT</span>' : ''}
        </div>

        <div class="event-content">
          <h3 class="event-title">${event.title}</h3>
          <p class="event-tagline">${event.tagline || event.description}</p>

          <div class="event-meta">
            <div class="meta-item">
              <span class="meta-icon">📅</span>
              <span>${formattedDate} • ${event.time}</span>
            </div>
            <div class="meta-item">
              <span class="meta-icon">📍</span>
              <span>${event.location}</span>
            </div>
          </div>

          <!-- Capacity Bar Gauge -->
          <div class="capacity-box">
            <div class="capacity-header">
              <span class="capacity-label">Venue Capacity:</span>
              <span class="capacity-numbers">${event.registered_count} / ${event.max_capacity} Seats</span>
            </div>
            <div class="capacity-bar-track">
              <div class="capacity-bar-fill ${barClass}" style="width: ${percent}%;"></div>
            </div>
            <div class="spots-left-note">
              <span>${percent}% reserved</span>
              <span>${isFull ? '<strong style="color: #f43f5e;">Venue Full</strong>' : `${event.remaining_spots} spots remaining`}</span>
            </div>
          </div>

          <!-- Action Button -->
          <button 
            class="btn ${isFull ? 'btn-secondary' : 'btn-primary'} btn-block" 
            ${isFull ? 'disabled' : ''}
            onclick="openRegistrationModal(${event.id})"
            id="register-btn-${event.id}"
          >
            ${isFull ? '⛔ Capacity Reached (Sold Out)' : '🎟️ Register Free Seat'}
          </button>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Open registration modal for an event
 */
window.openRegistrationModal = function(eventId) {
  const event = allEvents.find(e => e.id === eventId);
  if (!event) return;

  if (event.registered_count >= event.max_capacity) {
    showToast('This event has already reached full capacity!', 'warning');
    return;
  }

  document.getElementById('regEventId').value = event.id;
  document.getElementById('regModalEventTitle').innerText = event.title;
  document.getElementById('regModalEventSubtitle').innerText = `${event.location} • ${event.date}`;

  const alertBox = document.getElementById('modalCapacityAlert');
  alertBox.innerHTML = `
    <div style="background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.3); padding: 0.65rem 0.85rem; border-radius: var(--radius-sm); color: #c7d2fe;">
      ⚡ <strong>${event.remaining_spots}</strong> seats remaining out of ${event.max_capacity} total capacity.
    </div>
  `;

  document.getElementById('registrationModal').classList.add('active');
  document.getElementById('regStudentName').focus();
};

function closeRegistrationModal() {
  document.getElementById('registrationModal').classList.remove('active');
  document.getElementById('registrationForm').reset();
}

/**
 * Handle attendee registration submission
 */
async function handleRegistrationSubmit(e) {
  e.preventDefault();

  const submitBtn = document.getElementById('submitRegBtn');
  const submitText = document.getElementById('submitRegBtnText');
  const originalText = submitText.innerText;

  const eventId = parseInt(document.getElementById('regEventId').value, 10);
  const studentName = document.getElementById('regStudentName').value;
  const studentEmail = document.getElementById('regStudentEmail').value;
  const studentId = document.getElementById('regStudentId').value;
  const department = document.getElementById('regDepartment').value;

  try {
    submitBtn.disabled = true;
    submitText.innerText = 'Signing QR & Dispatching Pass...';

    const response = await fetch('/api/tickets/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventId,
        studentName,
        studentEmail,
        studentId,
        department
      })
    });

    const result = await response.json();

    if (!response.ok) {
      if (response.status === 409) {
        showToast(result.error || 'Venue capacity reached!', 'error');
        closeRegistrationModal();
        loadEvents(); // Refresh capacity counters
        return;
      }
      showToast(result.error || 'Registration failed.', 'error');
      return;
    }

    // Success!
    closeRegistrationModal();
    showToast('Registration successful! Digital pass generated.', 'success');
    loadEvents(); // Refresh remaining capacity counters

    // Display the generated ticket pass modal
    displayTicketPassModal(result);

  } catch (err) {
    console.error('Registration submit error:', err);
    showToast('Network error occurred during registration.', 'error');
  } finally {
    submitBtn.disabled = false;
    submitText.innerText = originalText;
  }
}

/**
 * Populate and display Digital Ticket Pass Modal
 */
function displayTicketPassModal(data) {
  const { ticket, event, qrDataUrl, emailDispatch } = data;

  document.getElementById('passEventTitle').innerText = event.title;
  document.getElementById('passEventDateTime').innerText = `${event.date} • ${event.time}`;
  document.getElementById('passEventLocation').innerText = `📍 ${event.location}`;

  document.getElementById('passStudentName').innerText = ticket.studentName || ticket.student_name;
  document.getElementById('passStudentId').innerText = ticket.studentId || ticket.student_id;
  document.getElementById('passDepartment').innerText = ticket.department;
  document.getElementById('passTicketCode').innerText = ticket.ticketCode || ticket.ticket_code;

  const qrImg = document.getElementById('passQrImg');
  qrImg.src = qrDataUrl;

  // Email status
  const emailRecipient = document.getElementById('emailBannerRecipient');
  const previewAnchor = document.getElementById('emailPreviewAnchor');

  if (emailDispatch && emailDispatch.success) {
    emailRecipient.innerText = `Ticket dispatched to ${ticket.studentEmail || ticket.student_email}`;
    if (emailDispatch.previewUrl) {
      previewAnchor.href = emailDispatch.previewUrl;
      previewAnchor.style.display = 'inline-block';
      previewAnchor.innerText = '🔗 Open Ethereal Sandbox Preview';
    } else {
      previewAnchor.style.display = 'none';
    }
  } else {
    emailRecipient.innerText = `Pass generated (Email provider in offline/sandbox mode)`;
    previewAnchor.style.display = 'none';
  }

  document.getElementById('ticketPassModal').classList.add('active');
}

/**
 * Handle "Find My Pass" lookup
 */
async function handleLookupPass() {
  const input = document.getElementById('lookupTicketCode');
  const code = input.value.trim().toUpperCase();

  if (!code) {
    showToast('Please enter a ticket serial code.', 'warning');
    return;
  }

  try {
    const res = await fetch(`/api/tickets/${encodeURIComponent(code)}`);
    const data = await res.json();

    if (!res.ok || !data.success) {
      showToast(data.error || 'Ticket not found. Verify your code.', 'error');
      return;
    }

    document.getElementById('findPassModal').classList.remove('active');
    input.value = '';

    displayTicketPassModal({
      ticket: data.ticket,
      event: {
        title: data.ticket.event_title,
        date: data.ticket.event_date,
        time: data.ticket.event_time,
        location: data.ticket.event_location
      },
      qrDataUrl: data.qrDataUrl,
      emailDispatch: { success: true }
    });

  } catch (err) {
    console.error('Lookup error:', err);
    showToast('Failed to retrieve ticket pass.', 'error');
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
