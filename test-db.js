import mongoose from 'mongoose';
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const testDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const users = await User.find({}).select('fullName email userName role isActive');
    
    console.log('=== Users in Database ===');
    users.forEach(u => {
      console.log(`- ${u.fullName} (${u.email})`);
      console.log(`  Username: ${u.userName}`);
      console.log(`  Role: ${u.role}`);
      console.log(`  Active: ${u.isActive}\n`);
    });
    
    console.log(`Total users: ${users.length}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

testDB();
