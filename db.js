// sno-relax-server/db.js
const mongoose = require('mongoose');

// Only connect when a MONGODB_URI (or MONGO_URI) environment variable is provided.
// This prevents the server from attempting to connect to localhost in hosted environments.
// Set `MONGODB_URI` in your deployment or local env when you want DB connectivity.
const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || null;

// By default disable mongoose buffering so model operations fail fast when DB is unavailable.
mongoose.set('bufferCommands', false);

const connectDB = async () => {
  if (!MONGO_URI) {
    console.warn('⚠️ [DB] No MONGODB_URI set — skipping MongoDB connection. Using in-memory stores only.');
    return;
  }

  try {
    console.log("🔗 [DB] Attempting to connect to MongoDB...");
    console.log("🔗 [DB] URI: (hidden)");

    // Use a short server selection timeout so the app doesn't hang for long when Mongo is unreachable
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
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
