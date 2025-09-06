# SnoRelax Backend

This is the backend for **SnoRelax**, a mental wellness and community platform.  
It is built with Node.js and Express, and serves as the API for the SnoRelax frontend.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Features](#features)
- [API Documentation](#api-documentation)
- [Setup Instructions](#setup-instructions)
- [Usage](#usage)
- [Deployment](#deployment)
- [Project Structure](#project-structure)
- [Authors](#authors)
- [Connected App Links](#connected-app-links)
- [License](#license)

---

## Project Overview

SnoRelax is a web application designed to support mental wellness through mood tracking, community engagement, and chatbot support. The backend provides RESTful APIs for user management, community features, and mood analytics.

---

## Features

- **User Registration & Login:**  
  Users can register and log in with their details. User data is stored in `users.json`.

- **Admin Management:**  
  Only admin users (listed in `admins.json`) can create and manage communities and groups.

- **Community Management:**  
  Admins can create and manage communities. Community data is stored in `communities.json`.

- **Mood Tracking:**  
  Users can log their daily mood. Mood data is stored and can be retrieved for analytics.

- **Chatbot Support:**  
  Users can interact with a simple chatbot for mental wellness support.

- **RESTful API:**  
  All features are accessible via RESTful endpoints.

---

## API Documentation

### User Endpoints

- `POST /api/create-user`  
  Register a new user.  
  **Body:** `{ firstName, lastName, email, phone, city, latitude, longitude }`  
  **Returns:** `{ userId }`

- `POST /api/login`  
  Login with userId.  
  **Body:** `{ userId }`  
  **Returns:** `{ ok, user }`

### Community Endpoints

- `POST /api/community/create`  
  Create a community (admin only).  
  **Body:** `{ name, description, createdBy }`  
  **Returns:** `{ message, community }`

### Mood Endpoints

- `GET /api/moods?userId=...`  
  Get moods for a user.

- `POST /api/moods`  
  Add a mood entry.  
  **Body:** `{ userId, mood }`

### Chatbot Endpoint

- `POST /api/chat`  
  Chatbot interaction.  
  **Body:** `{ message }`  
  **Returns:** `{ text }`

---

## Setup Instructions

1. **Clone the repository and install dependencies:**
   ```bash
   npm install
   ```

2. **Environment Variables:**  
   Create a `.env` file in the root with:
   ```
   PORT=5000
   ALLOWED_ORIGINS=https://sno-relax-client.vercel.app,http://localhost:3000
   ```

3. **Run the server locally:**
   ```bash
   npm start
   ```

---

## Usage

- Use tools like [Postman](https://www.postman.com/) to test API endpoints.
- Connect the frontend app to this backend for full functionality.
- Admin users are defined in `admins.json`.

---

## Deployment

The backend is hosted on Render:  
**[https://sno-relax-server-hostside.onrender.com/](https://sno-relax-server-hostside.onrender.com/)**

To deploy:
- Push your code to a Git repository.
- Connect the repo to [Render](https://render.com/).
- Set environment variables as described above.

---

## Project Structure

- `index.js` — Main server file
- `users.json` — User data
- `admins.json` — Admin user data
- `communities.json` — Community data
- `routes/` — Express route modules
- `middleware/` — Custom middleware (e.g., admin check)

---

## Authors

- Shivam Kumar Dubey (Admin)
- Suryakant Mishra (Admin)

---

## Connected App Links

- **Frontend:** [https://sno-relax-client.vercel.app/](https://sno-relax-client.vercel.app/)
- **Backend:** [https://sno-relax-server-hostside.onrender.com/](https://sno-relax-server-hostside.onrender.com/)

---

## License

This project is for educational purposes as part of a final year project.  
[Specify your license here, e.g., MIT, if desired.]

---
