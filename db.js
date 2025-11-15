// sno-relax-server/db.js
const mongoose = require('mongoose');
let mongoMemoryServer = null;
let MongoMemoryServer;
try {
  // require at runtime so production (no dev dep) isn't affected
  MongoMemoryServer = require('mongodb-memory-server').MongoMemoryServer;
} catch (e) {
  MongoMemoryServer = null;
}

// Only connect when a MONGODB_URI (or MONGO_URI) environment variable is provided.
// This prevents the server from attempting to connect to localhost in hosted environments.
// Set `MONGODB_URI` in your deployment or local env when you want DB connectivity.
const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || null;

// Keep mongoose buffering enabled by default to avoid throwing when routes call models
// before a connection is established. Route handlers should perform fallbacks where needed.
mongoose.set('bufferCommands', true);

const connectDB = async () => {
  if (!MONGO_URI) {
    if (process.env.NODE_ENV === 'development' && MongoMemoryServer) {
      console.log('ℹ️ [DB] No MONGODB_URI set — starting mongodb-memory-server for development');
      try {
        mongoMemoryServer = await MongoMemoryServer.create();
        const memUri = mongoMemoryServer.getUri();
        await mongoose.connect(memUri, { serverSelectionTimeoutMS: 5000 });
        console.log('✅ [DB] Connected to in-memory MongoDB for development');
        return;
      } catch (memErr) {
        console.warn('⚠️ [DB] Failed to start in-memory MongoDB:', memErr && memErr.message ? memErr.message : memErr);
        return;
      }
    }

    console.warn('⚠️ [DB] No MONGODB_URI set — skipping MongoDB connection. Using in-memory stores only.');
    return;
  }

  // Diagnostic: check if the URI appears local or cloud (don't print the full URI)
  try {
    const isLocal = /localhost|127\.0\.0\.1/.test(MONGO_URI);
    const isSRV = /mongodb\+srv:/.test(MONGO_URI);
    console.log(`🔗 [DB] Attempting to connect to MongoDB... (type=${isSRV ? 'atlas-srv' : isLocal ? 'local' : 'uri'})`);
  } catch (e) {
    console.log('🔗 [DB] Attempting to connect to MongoDB...');
  }

  try {
    // Use a short server selection timeout so the app doesn't hang for long when Mongo is unreachable
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log('✅ [DB] MongoDB connected successfully');
    console.log('✅ [DB] Connected to:', mongoose.connection.name);
  } catch (err) {
    console.warn('⚠️ [DB] MongoDB connection error:', err.message);
    // If local development and mongodb-memory-server is available, try falling back
    if (process.env.NODE_ENV === 'development' && MongoMemoryServer) {
      console.log('ℹ️ [DB] Attempting to start mongodb-memory-server fallback (development only)');
      try {
        mongoMemoryServer = await MongoMemoryServer.create();
        const memUri = mongoMemoryServer.getUri();
        await mongoose.connect(memUri, { serverSelectionTimeoutMS: 5000 });
        console.log('✅ [DB] Connected to in-memory MongoDB for development (fallback)');
        return;
      } catch (memErr) {
        console.warn('⚠️ [DB] In-memory MongoDB fallback failed:', memErr && memErr.message ? memErr.message : memErr);
      }
    }

    console.warn('⚠️ [DB] Server will attempt to continue without MongoDB');
  }
};

module.exports = connectDB;
