const express = require('express');
const router = express.Router();
const isAdmin = require('../middleware/adminCheck');
const fs = require('fs');
const path = require('path');

const communitiesFile = path.join(__dirname, '../communities.json');

// POST /api/community/create
router.post('/create', isAdmin, (req, res) => {
  const { name, description, createdBy } = req.body;

  if (!name || !description || !createdBy) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  let communities = [];
  if (fs.existsSync(communitiesFile)) {
    communities = JSON.parse(fs.readFileSync(communitiesFile, 'utf-8'));
  }

  const newCommunity = {
    id: Date.now().toString(),
    name,
    description,
    createdBy,
    createdAt: new Date().toISOString(),
    members: [createdBy]
  };

  communities.push(newCommunity);
  fs.writeFileSync(communitiesFile, JSON.stringify(communities, null, 2));

  res.json({ message: 'Community created', community: newCommunity });
});

// Only admin can manage group
router.post('/manage-group', isAdmin, (req, res) => {
  // ...group management logic...
  res.json({ message: 'Group managed' });
});

module.exports = router;