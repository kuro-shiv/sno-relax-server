const fs = require('fs');
const path = require('path');

const admins = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../admins.json'), 'utf-8')
);

function isAdmin(req, res, next) {
  const { phone, email, userId } = req.body;
  const match = admins.find(
    (admin) =>
      admin.phone === phone ||
      admin.email === email ||
      admin.userId === userId
  );
  if (match) {
    next();
  } else {
    res.status(403).json({ error: 'Admin access required' });
  }
}

module.exports = isAdmin;