const db = require('../data/db');

const connectDB = async () => {
  try {
    await db.testConnection();
    console.log('✅ Supabase Connected');
  } catch (error) {
    console.error(`❌ Supabase Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
