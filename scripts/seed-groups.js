// sno-relax-server/scripts/seed-groups.js
// Run this script to populate default groups in MongoDB
// Usage: node scripts/seed-groups.js

require('dotenv').config();
const mongoose = require('mongoose');
const CommunityGroup = require('../models/CommunityGroup');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is not set. Please set it in your .env file.');
  process.exit(1);
}

const connectDB = async () => {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    console.log('✅ Connected to MongoDB');
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  }
};

const seedGroups = async () => {
  try {
    // Check if groups already exist
    const existingCount = await CommunityGroup.countDocuments({ isActive: true });
    if (existingCount > 0) {
      console.log(`ℹ️  ${existingCount} active groups already exist. Skipping seed.`);
      return;
    }

    const defaultGroups = [
      {
        name: "Motivation",
        description: "Daily motivational talks and positive energy 💪",
        createdBy: "system",
        adminId: "system",
        isPrivate: false,
        members: [
          {
            userId: "system",
            nickname: "System Admin",
            joinedAt: new Date(),
          },
        ],
        maxMembers: 500,
        isActive: true,
      },
      {
        name: "Mindfulness",
        description: "Relax, meditate and share peace 🧘",
        createdBy: "system",
        adminId: "system",
        isPrivate: false,
        members: [
          {
            userId: "system",
            nickname: "System Admin",
            joinedAt: new Date(),
          },
        ],
        maxMembers: 500,
        isActive: true,
      },
      {
        name: "Support & Sharing",
        description: "A safe place to talk and be heard 💙",
        createdBy: "system",
        adminId: "system",
        isPrivate: false,
        members: [
          {
            userId: "system",
            nickname: "System Admin",
            joinedAt: new Date(),
          },
        ],
        maxMembers: 500,
        isActive: true,
      },
      {
        name: "Health Tips",
        description: "Share and learn health and wellness tips 🏥",
        createdBy: "system",
        adminId: "system",
        isPrivate: false,
        members: [
          {
            userId: "system",
            nickname: "System Admin",
            joinedAt: new Date(),
          },
        ],
        maxMembers: 500,
        isActive: true,
      },
      {
        name: "Off Topic",
        description: "Fun, jokes, and casual chats 😄",
        createdBy: "system",
        adminId: "system",
        isPrivate: false,
        members: [
          {
            userId: "system",
            nickname: "System Admin",
            joinedAt: new Date(),
          },
        ],
        maxMembers: 500,
        isActive: true,
      },
    ];

    console.log('📝 Seeding default groups...');
    const inserted = await CommunityGroup.insertMany(defaultGroups);
    console.log(`✅ Successfully created ${inserted.length} default groups:`);
    inserted.forEach((group, idx) => {
      console.log(`   ${idx + 1}. ${group.name}`);
    });
  } catch (err) {
    console.error('❌ Error seeding groups:', err.message);
    process.exit(1);
  }
};

const run = async () => {
  await connectDB();
  await seedGroups();
  await mongoose.connection.close();
  console.log('✅ Seed complete. Connection closed.');
  process.exit(0);
};

run();
