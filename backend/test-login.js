require('dotenv').config();
const db = require('./data/db');
const bcrypt = require('bcryptjs');

async function testLogin() {
  console.log('\n🔍 Testing Login System...\n');
  
  try {
    // Initialize database
    await db.initialize();
    console.log('✅ Database initialized');
    
    // Test connection
    await db.testConnection();
    console.log('✅ Database connection successful');
    
    // Ensure admin exists
    const admin = await db.ensureAdminFromEnv();
    console.log(`✅ Admin account: ${admin.email}`);
    console.log(`   Role: ${admin.role}`);
    console.log(`   Active: ${admin.isActive}`);
    
    // Test admin login
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@college.edu.in';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@2026';
    
    const adminUser = await db.findUserByEmail(adminEmail, { includePassword: true });
    if (!adminUser) {
      console.log('❌ Admin user not found in database');
      return;
    }
    
    const passwordMatch = await bcrypt.compare(adminPassword, adminUser.password);
    console.log(`✅ Admin password verification: ${passwordMatch ? 'PASS' : 'FAIL'}`);
    
    // List all users
    const { users, total } = await db.listUsers({ page: 1, limit: 100 });
    console.log(`\n📋 Total users in database: ${total}`);
    
    users.forEach(user => {
      console.log(`   - ${user.email} (${user.role}) - Active: ${user.isActive}`);
    });
    
    // Test faculty accounts
    const facultyUsers = users.filter(u => u.role === 'faculty');
    console.log(`\n👨‍🏫 Faculty accounts: ${facultyUsers.length}`);
    
    if (facultyUsers.length === 0) {
      console.log('⚠️  No faculty accounts found. Creating test faculty...');
      
      const testFaculty = await db.createUser({
        name: 'Test Faculty',
        email: 'faculty@college.edu.in',
        password: 'Faculty@123',
        role: 'faculty',
        department: 'Computer Science',
        phone: '1234567890',
        isActive: true,
        mustChangePassword: false
      });
      
      console.log(`✅ Created test faculty: ${testFaculty.email}`);
      console.log(`   Password: Faculty@123`);
    }
    
    // Test warden accounts
    const wardenUsers = users.filter(u => u.role === 'warden');
    console.log(`\n🛡️  Warden accounts: ${wardenUsers.length}`);
    
    if (wardenUsers.length === 0) {
      console.log('⚠️  No warden accounts found. Creating test warden...');
      
      const testWarden = await db.createUser({
        name: 'Test Warden',
        email: 'warden@college.edu.in',
        password: 'Warden@123',
        role: 'warden',
        department: 'Hostel Management',
        phone: '9876543210',
        isActive: true,
        mustChangePassword: false
      });
      
      console.log(`✅ Created test warden: ${testWarden.email}`);
      console.log(`   Password: Warden@123`);
    }
    
    console.log('\n✅ All tests completed!\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
  }
  
  process.exit(0);
}

testLogin();
