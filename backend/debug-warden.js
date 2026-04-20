require('dotenv').config();
const db = require('./data/db');

async function debug() {
  try {
    await db.initialize();
    await db.testConnection();
    console.log('✓ Connected to database\n');

    // Find all wardens
    const wardensResult = await db.listUsers({ role: 'warden', page: 1, limit: 1000 });
    const wardens = wardensResult.users;
    console.log(`Found ${wardens.length} warden(s):\n`);
    wardens.forEach(w => {
      console.log(`  - Name: ${w.name}`);
      console.log(`    Email: ${w.email}`);
      const assigned = w.assignedHostel;
      console.log(`    Assigned Hostel: ${assigned ? `${assigned.name} (ID: ${assigned._id})` : 'NONE (THIS IS THE PROBLEM!)'}`);
      console.log('');
    });

    // Find all visits
    const visitsResult = await db.listVisits({}, { page: 1, limit: 5000, includeRelations: true });
    const visits = visitsResult.visits;
    console.log(`\nFound ${visits.length} visit(s):\n`);
    visits.forEach(v => {
      console.log(`  - Faculty: ${v.faculty.name} (${v.faculty.email})`);
      console.log(`    Hostel: ${v.hostel.name} (ID: ${v.hostel._id})`);
      console.log(`    Status: ${v.status}`);
      console.log(`    Check-in: ${v.checkIn}`);
      console.log('');
    });

    // Check if warden's hostel matches any visit's hostel
    if (wardens.length > 0 && visits.length > 0) {
      console.log('\n=== MATCHING CHECK ===');
      wardens.forEach(w => {
        const assigned = w.assignedHostel;
        if (assigned) {
          const matchingVisits = visits.filter(v => String(v.hostel._id) === String(assigned._id));
          console.log(`Warden ${w.name} should see ${matchingVisits.length} visit(s) for hostel ${assigned.name}`);
        } else {
          console.log(`⚠ Warden ${w.name} has NO assigned hostel - THEY WON'T SEE ANY VISITS!`);
        }
      });
    }
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

debug();
