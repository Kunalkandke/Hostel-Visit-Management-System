require('dotenv').config();
const db = require('../data/db');

async function seedAdmin() {
  await db.initialize();
  const admin = await db.ensureAdminFromEnv();
  console.log(`✅ Admin ensured: ${admin.email}`);
  process.exit(0);
}
seedAdmin().catch(e => { console.error(e); process.exit(1); });
