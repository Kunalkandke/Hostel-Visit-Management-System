require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const { Visit } = require('./models/index');

async function debug() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to database\n');

    // Find all wardens
    const wardens = await User.find({ role: 'warden' }).populate('assignedHostel', 'name type');
    console.log(`Found ${wardens.length} warden(s):\n`);
    wardens.forEach(w => {
      console.log(`  - Name: ${w.name}`);
      console.log(`    Email: ${w.email}`);
      console.log(`    Assigned Hostel: ${w.assignedHostel ? `${w.assignedHostel.name} (ID: ${w.assignedHostel._id})` : 'NONE (THIS IS THE PROBLEM!)'}`);
      console.log('');
    });

    // Find all visits
    const visits = await Visit.find().populate('hostel', 'name').populate('faculty', 'name email');
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
        if (w.assignedHostel) {
          const matchingVisits = visits.filter(v => v.hostel._id.toString() === w.assignedHostel._id.toString());
          console.log(`Warden ${w.name} should see ${matchingVisits.length} visit(s) for hostel ${w.assignedHostel.name}`);
        } else {
          console.log(`⚠ Warden ${w.name} has NO assigned hostel - THEY WON'T SEE ANY VISITS!`);
        }
      });
    }

    await mongoose.connection.close();
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

debug();
