# Antarman 🎯
> **Find Your Flow. Own Your Time.**  
> A smart Pomodoro productivity app with user authentication and persistent data.  
> Built by **Team Gear** — Pranay Tanpure (Lead), Vipin Rathod, Tushar Supekar, Kartik Rokade, Virdhaval Sawant

---

## Project Structure

```
antarman/
├── backend/
│   ├── server.js                  # Express app entry point
│   ├── package.json
│   ├── .env.example               # Copy to .env and set JWT_SECRET
│   ├── routes/
│   │   ├── auth.js                # POST /api/auth/register, /login
│   │   └── user.js                # Profile, tasks, stats, settings
│   ├── middleware/
│   │   └── authMiddleware.js      # JWT verification
│   ├── utils/
│   │   └── fileStore.js           # JSON file read/write helpers
│   └── data/
│       └── users.json             # Flat-file database (auto-created)
│
└── frontend/
    ├── index.html                 # Login / Register page
    ├── app.html                   # Main Pomodoro app (auth-protected)
    ├── css/
    │   ├── auth.css
    │   └── app.css
    └── js/
        ├── auth.js                # Login/register API calls
        └── app.js                 # Timer, tasks, stats, settings
```

---

## Setup & Run

```bash
# 1. Create your .env file
copy backend\.env.example backend\.env
# Edit backend/.env → set:  JWT_SECRET=some_long_random_string

# 2. Install dependencies
npm run install

# 3. Start everything
npm start
```

Open **http://localhost:5000** — frontend and API both served from one process.

For auto-reload during development:
```bash
npm run dev
```

> `data/users.json` is created automatically on first registration — no database setup needed.

---

## API Reference

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/auth/register` | — | Register new user |
| POST | `/api/auth/login` | — | Login, returns JWT |
| GET | `/api/user/profile` | ✓ | Get profile + settings + tasks |
| PUT | `/api/user/settings` | ✓ | Update timer settings |
| GET | `/api/user/tasks` | ✓ | List tasks |
| POST | `/api/user/tasks` | ✓ | Add task |
| PATCH | `/api/user/tasks/:id` | ✓ | Toggle complete / edit |
| DELETE | `/api/user/tasks/:id` | ✓ | Delete task |
| POST | `/api/user/session` | ✓ | Log completed focus session |
| GET | `/api/user/stats` | ✓ | Get stats + daily log |

All protected routes require: `Authorization: Bearer <token>`

---

## Features

- 🔐 JWT authentication with bcrypt password hashing
- ⏱ Pomodoro timer — Focus / Short Break / Long Break
- 🔄 Animated SVG countdown ring
- ✅ Task manager with per-user persistence
- 📊 Daily + all-time stats
- ⚙ Configurable durations, auto-start, sound toggle
- 🔔 Browser notifications + Web Audio API chime
- 💾 All data stored in `data/users.json` — no database required
