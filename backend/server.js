require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');
const db = require('./data/db');

const PORT = process.env.PORT || 5000;

const ensureAdmin = async () => {
  await db.ensureAdminFromEnv();
  console.log(`✅ Admin account ensured: ${process.env.ADMIN_EMAIL || 'admin@college.edu.in'}`);
};

const start = async () => {
  await db.initialize();
  await connectDB();
  await ensureAdmin();
  app.listen(PORT, () => {
    console.log(`\n🚀 HVMS Server → http://localhost:${PORT}`);
    console.log(`📧 Email  → ${process.env.SMTP_EMAIL}`);
    console.log(`🗄️  DB    → ${process.env.SUPABASE_URL}\n`);
  });
};

start();
