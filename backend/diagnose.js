require('dotenv').config();

console.log('\n🔍 HVMS Backend Diagnostics\n');
console.log('='.repeat(50));

// Environment Variables
console.log('\n📋 Environment Variables:');
console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
console.log(`   PORT: ${process.env.PORT || 'not set (default: 5000)'}`);
console.log(`   SUPABASE_URL: ${process.env.SUPABASE_URL ? '✅ Set' : '❌ Not set'}`);
console.log(`   SUPABASE_SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Not set'}`);
console.log(`   JWT_SECRET: ${process.env.JWT_SECRET ? '✅ Set' : '❌ Not set'}`);
console.log(`   FRONTEND_URL: ${process.env.FRONTEND_URL || '❌ Not set'}`);
console.log(`   FRONTEND_URLS: ${process.env.FRONTEND_URLS || 'not set'}`);
console.log(`   ADMIN_EMAIL: ${process.env.ADMIN_EMAIL || 'not set (default: admin@college.edu.in)'}`);
console.log(`   SMTP_EMAIL: ${process.env.SMTP_EMAIL ? '✅ Set' : '⚠️  Not set (emails disabled)'}`);

// CORS Configuration
console.log('\n🔐 CORS Configuration:');
const normalizeOrigin = (value) => (value || '').trim().replace(/\/+$/, '');
const defaultAllowedOrigins = ['https://hvms-system.vercel.app', 'http://localhost:3000'];
const envAllowedOrigins = [process.env.FRONTEND_URL, process.env.FRONTEND_URLS]
  .filter(Boolean)
  .flatMap((value) => value.split(','))
  .map(normalizeOrigin)
  .filter(Boolean);
const allowedOrigins = Array.from(new Set([...defaultAllowedOrigins, ...envAllowedOrigins].map(normalizeOrigin)));

console.log('   Allowed Origins:');
allowedOrigins.forEach(origin => {
  console.log(`      - ${origin}`);
});
console.log('   Plus: All *.vercel.app domains');

// Database Connection
console.log('\n🗄️  Database Connection:');
if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.log('   ✅ Credentials configured');
  console.log(`   URL: ${process.env.SUPABASE_URL}`);
  
  // Test connection
  (async () => {
    try {
      const db = require('./data/db');
      await db.testConnection();
      console.log('   ✅ Connection successful');
      
      // Check admin
      const admin = await db.findUserByEmail(
        process.env.ADMIN_EMAIL || 'admin@college.edu.in',
        { includePassword: false }
      );
      
      if (admin) {
        console.log(`   ✅ Admin account exists: ${admin.email}`);
        console.log(`      Role: ${admin.role}`);
        console.log(`      Active: ${admin.isActive}`);
      } else {
        console.log('   ⚠️  Admin account not found (will be created on startup)');
      }
      
      // Count users
      const { total } = await db.listUsers({ page: 1, limit: 1 });
      console.log(`   📊 Total users: ${total}`);
      
    } catch (error) {
      console.log(`   ❌ Connection failed: ${error.message}`);
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('\n✅ Diagnostics complete!\n');
    process.exit(0);
  })();
} else {
  console.log('   ❌ Missing Supabase credentials');
  console.log('\n' + '='.repeat(50));
  console.log('\n❌ Cannot proceed without database credentials\n');
  process.exit(1);
}
