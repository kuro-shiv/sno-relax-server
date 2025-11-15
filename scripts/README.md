# Database Seed Scripts

## Seeding Default Groups

To populate your MongoDB database with default community groups, run:

```bash
node scripts/seed-groups.js
```

### Prerequisites
- Ensure `MONGODB_URI` is set in your `.env` file
- The database connection must be accessible

### What Gets Created
The seed script creates 5 default community groups:
1. **Motivation** - Daily motivational talks and positive energy 💪
2. **Mindfulness** - Relax, meditate and share peace 🧘
3. **Support & Sharing** - A safe place to talk and be heard 💙
4. **Health Tips** - Share and learn health and wellness tips 🏥
5. **Off Topic** - Fun, jokes, and casual chats 😄

### Notes
- Groups are created as public (not private)
- Each group has a max member limit of 500
- The script only seeds groups if none exist (safe to run multiple times)
- All groups are created by "system" admin user

### Troubleshooting
If the script fails:
1. Check that `MONGODB_URI` is properly set
2. Verify database connectivity: `ping your-mongo-server`
3. Check database credentials
4. View logs for detailed error messages
