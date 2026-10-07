const assert = require('assert');
const db = require('../src/db/database');
const cryptoService = require('../src/services/cryptoService');
const { seedDatabase } = require('../src/db/seed');

async function runSystemTests() {
  console.log('🧪 Starting Event Ticketing & Check-In Automated Test Suite...\n');

  // 1. Database seed check
  seedDatabase();
  const events = db.getAllEvents();
  assert(events.length >= 4, 'Should have at least 4 events seeded');
  console.log(`✅ Test 1: Seeded events verified (${events.length} active campus events).`);

  // 2. Capacity Limit Enforcement Test
  const limitedEvent = events.find(e => e.slug === 'limited-vip-masterclass');
  assert(limitedEvent, 'Limited capacity event must exist');
  console.log(`   Testing capacity limits on "${limitedEvent.title}" (Capacity: ${limitedEvent.max_capacity})`);

  // It starts with 2 out of 3 registered. Let's register 1 more to fill it to capacity (3/3):
  const tkt3 = db.registerAttendee({
    eventId: limitedEvent.id,
    studentName: 'Test Student 3',
    studentEmail: 'student3@test.edu',
    studentId: 'TEST-003',
    department: 'Cybersecurity',
    ticketCode: 'TKT-TEST-003',
    qrToken: cryptoService.generateTicketToken({
      eventId: limitedEvent.id,
      ticketCode: 'TKT-TEST-003',
      studentId: 'TEST-003',
      studentEmail: 'student3@test.edu'
    })
  });
  assert(tkt3.ticket_code === 'TKT-TEST-003', 'Ticket 3 should register');
  console.log('   Registered 3rd attendee to hit exact capacity (3/3).');

  // Now attempt to register a 4th attendee: MUST be rejected!
  let capacityRejected = false;
  try {
    db.registerAttendee({
      eventId: limitedEvent.id,
      studentName: 'Over Capacity Student 4',
      studentEmail: 'student4@test.edu',
      studentId: 'TEST-004',
      department: 'Cybersecurity',
      ticketCode: 'TKT-TEST-004',
      qrToken: 'FAKE_TOKEN'
    });
  } catch (err) {
    if (err.code === 'CAPACITY_REACHED') {
      capacityRejected = true;
    }
  }
  assert(capacityRejected, 'Registration must be rejected once venue capacity is reached!');
  console.log('✅ Test 2: Capacity Limit Enforcement passed (Excess registrations rejected with CAPACITY_REACHED).');

  // 3. Cryptographic Signature Validation Test
  const validToken = cryptoService.generateTicketToken({
    eventId: limitedEvent.id,
    ticketCode: 'TKT-TEST-003',
    studentId: 'TEST-003',
    studentEmail: 'student3@test.edu'
  });
  const validCheck = cryptoService.verifyTicketToken(validToken);
  assert(validCheck.valid === true, 'Token must be valid');
  assert(validCheck.payload.ticketCode === 'TKT-TEST-003', 'Payload ticket code must match');

  // Tamper with signature:
  const tamperedToken = cryptoService.createTamperedToken(validToken);
  const tamperedCheck = cryptoService.verifyTicketToken(tamperedToken);
  assert(tamperedCheck.valid === false, 'Tampered token must be rejected');
  assert(tamperedCheck.reason.includes('signature mismatch'), 'Reason must indicate signature mismatch');
  console.log('✅ Test 3: Cryptographic signature validation & tamper detection passed.');

  // 4. First Valid Scan -> CHECKED-IN
  const scan1 = db.processTicketCheckIn({
    ticketCode: 'TKT-TEST-003',
    eventId: limitedEvent.id,
    scannerDevice: 'Gate A Test Scanner',
    rawToken: validToken
  });
  assert(scan1.status === 'CHECKED_IN', 'First scan must return CHECKED_IN');
  assert(scan1.attendee.student_name === 'Test Student 3', 'Attendee details must match');
  console.log('✅ Test 4: First scan marks attendee as CHECKED-IN.');

  // 5. Subsequent Duplicate Scan -> ALREADY USED with timestamp
  const scan2 = db.processTicketCheckIn({
    ticketCode: 'TKT-TEST-003',
    eventId: limitedEvent.id,
    scannerDevice: 'Gate A Test Scanner',
    rawToken: validToken
  });
  assert(scan2.status === 'ALREADY_USED', 'Second scan must return ALREADY_USED');
  assert(scan2.checkedInAt, 'Must return original check-in timestamp');
  console.log(`✅ Test 5: Duplicate scan flagged as ALREADY USED (Original check-in timestamp: ${scan2.checkedInAt}).`);

  // 6. Unknown / Malformed Ticket -> INVALID TICKET
  const scan3 = db.processTicketCheckIn({
    ticketCode: 'NON_EXISTENT_CODE_9999',
    eventId: limitedEvent.id,
    scannerDevice: 'Gate A Test Scanner',
    rawToken: 'GARBAGE'
  });
  assert(scan3.status === 'INVALID_TICKET', 'Unknown ticket must return INVALID_TICKET');
  console.log('✅ Test 6: Unknown or counterfeit ticket flagged as INVALID TICKET.');

  // 7. Audit log verification
  const logs = db.getScanLogs(10);
  assert(logs.length >= 3, 'Scan logs must record all attempts');
  console.log(`✅ Test 7: Scan audit trail recorded successfully (${logs.length} audit entries).`);

  console.log('\n🎉 ALL 7 SYSTEM INTEGRATION TESTS PASSED WITH 100% SUCCESS!');
}

runSystemTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
