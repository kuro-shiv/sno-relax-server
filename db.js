// sno-relax-server/db.js
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/sno-relax';

const connectDB = async () => {
  try {
    console.log("🔗 [DB] Attempting to connect to MongoDB...");
    console.log("🔗 [DB] URI:", MONGO_URI);
    
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ [DB] MongoDB connected successfully');
    console.log('✅ [DB] Connected to:', mongoose.connection.name);
  } catch (err) {
    console.warn('⚠️ [DB] MongoDB connection error:', err.message);
    console.warn('⚠️ [DB] Server will attempt to continue without MongoDB');
  }
};

module.exports = connectDB;
