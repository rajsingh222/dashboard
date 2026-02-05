import mongoose from 'mongoose';
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const createAdminUser = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sppl_dashboard');
    
    console.log('📦 Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@spplindia.org' });
    
    if (existingAdmin) {
      console.log('✅ Admin user already exists!');
      console.log('Email:', existingAdmin.email);
      console.log('Role:', existingAdmin.role);
      
      // Update to admin role if not already
      if (existingAdmin.role !== 'admin') {
        existingAdmin.role = 'admin';
        await existingAdmin.save();
        console.log('✅ Updated existing user to admin role');
      }
    } else {
      // Create new admin user
      const adminUser = await User.create({
        fullName: 'Admin User',
        email: 'admin@spplindia.org',
        userName: 'admin',
        password: 'Admin@123456',
        role: 'admin',
        phoneNumber: '+91-1234567890',
        organization: 'SPPL India',
        isActive: true,
        isEmailVerified: true,
      });

      console.log('✅ Admin user created successfully!');
      console.log('Email:', adminUser.email);
      console.log('Password: Admin@123456');
      console.log('Role:', adminUser.role);
    }

    console.log('\n🎉 Setup complete!');
    console.log('\n📝 Admin Login Credentials:');
    console.log('   Email: admin@spplindia.org');
    console.log('   Password: Admin@123456');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  }
};

createAdminUser();
