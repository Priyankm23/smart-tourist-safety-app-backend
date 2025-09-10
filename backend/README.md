# Smart Tourist Safety — Backend

Lightweight backend for the Smart Tourist Safety system. Provides authentication, tourist and authority endpoints, geofencing, blockchain interaction stubs, realtime updates (Socket.IO), and MongoDB persistence.

## Quick overview
- Language: JavaScript (Node.js, CommonJS)
- Frameworks & libs: Express, Mongoose, Passport (JWT), Socket.IO, ethers
- Entry point: `app.js`
- Config: `config/config.js` (reads from `.env`)

## Requirements
- Node.js (v16+ recommended)
- npm
- A running MongoDB database (connection string provided via `.env`)

## Install

Open a terminal in the project root (PowerShell on Windows) and run:

```powershell
npm install
```

## Environment (.env)
Create a `.env` file at the project root. The app expects the following variables (sourced from `config/config.js`):

```
PORT=3000
DB_URL=mongodb://localhost:27017/tourist-safety
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
SERVER_URL=http://localhost:3000
CLOUDINARY_NAME=your_cloud_name
CLOUDINARY_KEY=your_cloudinary_key
CLOUDINARY_SECRET=your_cloudinary_secret
```

Note: Keep secrets out of version control.

## Scripts
Available npm scripts (from `package.json`):

- `npm run dev` — start in development using `nodemon app.js`
- `npm start` — start with `node app.js`

## Run
Start the app in development:

```powershell
npm run dev
```

Or start in production mode:

```powershell
npm start
```

The server logs the startup message and attempts to connect to MongoDB (see `config/dbConnection.js`).

## API (high level)
The app mounts these routers in `app.js`:

- `/api/auth` — authentication endpoints (login, signup, token refresh, social auth)
- `/api/tourist` — tourist related actions
- `/api/authority` — authority user management and endpoints
- `/api/blockchain` — blockchain-related actions (uses `ethers`)
- `/api/geofence` — geofence creation/validation

Each route group is implemented in `routes/` and handled by controllers in `controllers/`.

Authentication: JWT-based (see `jsonwebtoken`, `passport-jwt`). Protect routes using the supplied middleware in `middlewares/`.

Realtime: Socket.IO is initialized by `services/realtimeService.js` and wired to the HTTP server in `app.js`. Use this for live alerts and location updates.

Logging: HTTP request logging uses `morgan`; application logging uses `winston` (see `logs/` and `fallback.log`).

## Database
MongoDB via Mongoose. Connection logic is in `config/dbConnection.js`. Provide a valid `DB_URL` in `.env`.

## Development notes
- Code is CommonJS. Keep that style when adding files.
- Add new dependencies with `npm i <pkg> --save` and dev tools with `npm i <pkg> -D`.
- There are no unit tests in this repo by default — consider adding tests for controllers and services.

## Useful files
- `app.js` — server bootstrap and route wiring
- `package.json` — scripts and dependencies
- `config/config.js` — exported config (reads from `.env`)
- `routes/` — route declarations
- `controllers/` — request handlers
- `services/` — background and helper services (realtime, blockchain, fallback)
- `middlewares/` — authentication & error handling

## Troubleshooting
- If server won't start, check the `PORT` and `DB_URL` values in `.env`.
- For MongoDB connection issues, verify the DB is reachable and credentials are correct.
- Check `logs/fallback.log` for emergency logs written by the fallback service.

---
