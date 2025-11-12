# SnoRelax - Server

This is the backend server for the SnoRelax project. It provides REST endpoints for authentication, community features, chatbots, mood tracking, and an admin API. Socket.IO is used for realtime group and private chat.

## Quick start

1. Copy `.env.example` to `.env` and set the following variables:

- `MONGO_URI` - MongoDB connection string
- `PORT` - server port (default 5000)
- `ADMIN_SECRET` - simple admin secret for admin-only routes (recommended to use proper auth in prod)

2. Install dependencies and start:

```powershell
npm install
npm start
```

3. API endpoints are mounted under `/api/*`. Example:

- `GET /` - health check
- `POST /api/chat` - chatbot endpoint
- `GET /api/community/groups` - list community groups

## Models

The `models/` directory contains Mongoose models used by the server such as `User`, `ChatHistory`, `Content`, `CommunityGroup`, `GroupMessage`, `PrivateMessage`, `Announcement`, and `Mood`.

## Notes

- This project contains both legacy file-backed community routes (`/api/community/legacy`) and a newer Mongo-backed community API (`/api/community`).
- For production, replace `ADMIN_SECRET` header-based admin checks with JWT role checks and secure storage of credentials.
