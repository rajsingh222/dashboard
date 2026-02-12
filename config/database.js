import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    // Optimized for Render free tier - reduced pool for limited resources
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 5, // Reduced for free tier (limited connections)
      minPoolSize: 1,  // Keep 1 connection alive
      serverSelectionTimeoutMS: 10000, // Increased for slower cold starts
      socketTimeoutMS: 60000, // Longer socket timeout for Render
      family: 4, // Use IPv4, skip trying IPv6
      retryWrites: true,
      retryReads: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`Database Name: ${conn.connection.name}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    
    // Monitor connection events
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected');
    });
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
