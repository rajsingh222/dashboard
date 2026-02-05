import dotenv from 'dotenv';
import connectDB from '../config/database.js';
import User from '../models/User.js';

dotenv.config();

const seedAdmin = async () => {
  try {
    await connectDB();

    // Check if admin already exists
    const adminExists = await User.findOne({ 
      email: process.env.ADMIN_EMAIL || 'admin@spplindia.org' 
    });

    if (adminExists) {
      console.log('Admin user already exists');
      process.exit(0);
    }

    // Create admin user
    const admin = await User.create({
      fullName: 'System Administrator',
      email: process.env.ADMIN_EMAIL || 'admin@spplindia.org',
      userName: 'admin',
      password: process.env.ADMIN_PASSWORD || 'Admin@123456',
      role: 'admin',
      phoneNumber: '9999999999',
      isActive: true,
      isEmailVerified: true,
    });

    console.log('✅ Admin user created successfully');
    console.log('Email:', admin.email);
    console.log('Password:', process.env.ADMIN_PASSWORD || 'Admin@123456');
    console.log('\n⚠️  Please change the password after first login!');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin:', error);
    process.exit(1);
  }
};

seedAdmin();
