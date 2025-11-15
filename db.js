// sno-relax-server/db.js
const mongoose = require('mongoose');

// Use environment variable when provided; otherwise fall back to a local MongoDB URL.
// DO NOT hard-code production credentials here — set `MONGODB_URI` in your deployment environment.
const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/sno-relax';

// By default disable mongoose buffering so model operations fail fast when DB is unavailable.
mongoose.set('bufferCommands', false);

const connectDB = async () => {
  try {
    console.log("🔗 [DB] Attempting to connect to MongoDB...");
    console.log("🔗 [DB] URI:", MONGO_URI);

    // Use a short server selection timeout so the app doesn't hang for long when Mongo is unreachable
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      // family: 4 forces IPv4 (can help in some environments), uncomment if needed
      // family: 4,
    });

    console.log('✅ [DB] MongoDB connected successfully');
    console.log('✅ [DB] Connected to:', mongoose.connection.name);

    // Re-enable buffering after successful connection so normal Mongoose behavior resumes
    mongoose.set('bufferCommands', true);
  } catch (err) {
    console.warn('⚠️ [DB] MongoDB connection error:', err.message);
    console.warn('⚠️ [DB] Server will attempt to continue without MongoDB');
  }
};

module.exports = connectDB;
