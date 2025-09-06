const express = require('express');
const cors = require('cors');
const app = express();

// Importing the community routes
const communityRoutes = require('./routes/community');

// Using the community routes for the '/api/community' endpoint
app.use('/api/community', communityRoutes);

app.use(cors({
  origin: ['https://sno-relax-client.vercel.app', 'http://localhost:3000'],
  credentials: true
}));

app.post('/api/create-user', (req, res) => {
  // ...user creation logic...
  res.json({ userId: "some-generated-id" }); // Must return userId
});

const API_BASE =
  process.env.NODE_ENV === "production"
    ? "https://sno-relax-server-hostside.onrender.com"
    : "http://localhost:5000";

// ...existing code for other routes and middleware

module.exports = app;