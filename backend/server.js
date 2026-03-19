require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');
const User = require('./models/User');

const PORT = process.env.PORT || 5000;

const ensureAdmin = async () => {
  const count = await User.countDocuments({ role: 'admin' });
  if (count === 0) {
    await User.create({
      name: process.env.ADMIN_NAME || 'System Administrator',
      email: process.env.ADMIN_EMAIL || 'admin@college.edu.in',
      password: process.env.ADMIN_PASSWORD || 'Admin@2026',
      role: 'admin',
      department: 'Administration',
      isActive: true,
    });
    console.log(`✅ Admin account created: ${process.env.ADMIN_EMAIL}`);
  }
};

const start = async () => {
  await connectDB();
  await ensureAdmin();
  app.listen(PORT, () => {
    console.log(`\n🚀 HVMS Server → http://localhost:${PORT}`);
    console.log(`📧 Email  → ${process.env.SMTP_EMAIL}`);
    console.log(`🗄️  DB    → ${process.env.MONGODB_URI}\n`);
  });
};

start();
