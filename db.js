// sno-relax-server/db.js
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/sno-relax';

const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.warn('⚠️ MongoDB connection error (server will run without persistence):', err.message);
    // Don't exit — let server run in memory mode
  }
};

module.exports = connectDB;
