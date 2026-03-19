require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function seedAdmin() {
  await mongoose.connect(process.env.MONGODB_URI);
  const exists = await User.findOne({ role: 'admin' });
  if (exists) { console.log('Admin already exists:', exists.email); process.exit(0); }
  await User.create({
    name: process.env.ADMIN_NAME || 'System Administrator',
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
    role: 'admin',
    department: 'Administration',
    isActive: true,
  });
  console.log(`✅ Admin created: ${process.env.ADMIN_EMAIL}`);
  process.exit(0);
}
seedAdmin().catch(e => { console.error(e); process.exit(1); });
