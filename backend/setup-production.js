require('dotenv').config();
const db = require('./data/db');

async function setupProduction() {
  console.log('\n🚀 Setting up production environment...\n');
  
  try {
    // Initialize database
    console.log('📦 Initializing database schema...');
    await db.initialize();
    console.log('✅ Database schema initialized');
    
    // Test connection
    console.log('🔌 Testing database connection...');
    await db.testConnection();
    console.log('✅ Database connection successful');
    
    // Create admin account
    console.log('👤 Creating admin account...');
    const admin = await db.ensureAdminFromEnv();
    console.log(`✅ Admin account ready: ${admin.email}`);
    
    // Create sample faculty
    console.log('\n👨‍🏫 Creating sample faculty accounts...');
    
    const facultyAccounts = [
      {
        name: 'Dr. Rajesh Kumar',
        email: 'rajesh.kumar@college.edu.in',
        password: 'Faculty@123',
        role: 'faculty',
        department: 'Computer Science',
        phone: '9876543210'
      },
      {
        name: 'Prof. Priya Sharma',
        email: 'priya.sharma@college.edu.in',
        password: 'Faculty@123',
        role: 'faculty',
        department: 'Electronics',
        phone: '9876543211'
      },
      {
        name: 'Dr. Amit Patel',
        email: 'amit.patel@college.edu.in',
        password: 'Faculty@123',
        role: 'faculty',
        department: 'Mechanical',
        phone: '9876543212'
      }
    ];
    
    for (const faculty of facultyAccounts) {
      const existing = await db.findUserByEmail(faculty.email);
      if (!existing) {
        await db.createUser({
          ...faculty,
          isActive: true,
          mustChangePassword: false
        });
        console.log(`   ✅ Created: ${faculty.email}`);
      } else {
        console.log(`   ⏭️  Exists: ${faculty.email}`);
      }
    }
    
    // Create sample wardens
    console.log('\n🛡️  Creating sample warden accounts...');
    
    const wardenAccounts = [
      {
        name: 'Mr. Suresh Reddy',
        email: 'suresh.reddy@college.edu.in',
        password: 'Warden@123',
        role: 'warden',
        department: 'Hostel Management',
        phone: '9876543220'
      },
      {
        name: 'Mrs. Lakshmi Iyer',
        email: 'lakshmi.iyer@college.edu.in',
        password: 'Warden@123',
        role: 'warden',
        department: 'Hostel Management',
        phone: '9876543221'
      }
    ];
    
    for (const warden of wardenAccounts) {
      const existing = await db.findUserByEmail(warden.email);
      if (!existing) {
        await db.createUser({
          ...warden,
          isActive: true,
          mustChangePassword: false
        });
        console.log(`   ✅ Created: ${warden.email}`);
      } else {
        console.log(`   ⏭️  Exists: ${warden.email}`);
      }
    }
    
    // Create sample hostels
    console.log('\n🏢 Creating sample hostels...');
    
    const hostels = await db.listHostels({ includeInactive: true });
    
    if (hostels.length === 0) {
      const sampleHostels = [
        {
          name: 'Boys Hostel A',
          type: 'boys',
          capacity: 200,
          location: 'North Campus',
          isActive: true
        },
        {
          name: 'Boys Hostel B',
          type: 'boys',
          capacity: 180,
          location: 'South Campus',
          isActive: true
        },
        {
          name: 'Girls Hostel A',
          type: 'girls',
          capacity: 150,
          location: 'East Campus',
          isActive: true
        },
        {
          name: 'Girls Hostel B',
          type: 'girls',
          capacity: 120,
          location: 'West Campus',
          isActive: true
        }
      ];
      
      for (const hostel of sampleHostels) {
        await db.createHostel(hostel);
        console.log(`   ✅ Created: ${hostel.name}`);
      }
    } else {
      console.log(`   ⏭️  ${hostels.length} hostels already exist`);
    }
    
    // Summary
    console.log('\n📊 Setup Summary:');
    const { users, total } = await db.listUsers({ page: 1, limit: 100 });
    const allHostels = await db.listHostels({ includeInactive: true });
    
    console.log(`   👥 Total Users: ${total}`);
    console.log(`      - Admin: ${users.filter(u => u.role === 'admin').length}`);
    console.log(`      - Faculty: ${users.filter(u => u.role === 'faculty').length}`);
    console.log(`      - Warden: ${users.filter(u => u.role === 'warden').length}`);
    console.log(`   🏢 Total Hostels: ${allHostels.length}`);
    
    console.log('\n✅ Production setup completed successfully!\n');
    console.log('📝 Default Credentials:');
    console.log('   Admin: admin@college.edu.in / Admin@2026');
    console.log('   Faculty: rajesh.kumar@college.edu.in / Faculty@123');
    console.log('   Warden: suresh.reddy@college.edu.in / Warden@123\n');
    
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    console.error(error);
    process.exit(1);
  }
  
  process.exit(0);
}

setupProduction();
