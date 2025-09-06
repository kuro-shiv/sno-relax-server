const express = require('express');
const app = express();

// Importing the community routes
const communityRoutes = require('./routes/community');

// Using the community routes for the '/api/community' endpoint
app.use('/api/community', communityRoutes);

// ...existing code for other routes and middleware

module.exports = app;