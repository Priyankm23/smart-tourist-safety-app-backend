# Smart Tourist Safety 

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
DB_URL=your_mongo_connection_URL
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
PRIVATE_KEY=your_wallet_key
SMART_CONTRACT_ADDRESS_reg=your_registration_contract_address
SMART_CONTRACT_ADDRESS_sos=your_sos_contract_address
POLYGON_RPC=your_rpc_provider

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

## Docker
You can build and run the backend as a Docker container or use `docker-compose` to run the backend together with MongoDB.

1) Build the image locally (run from the `backend` folder):

```powershell
docker build -t tourist-backend:latest .
```

2) Run with a mounted `.env` (recommended for local dev):

```powershell
docker run --rm -p 3000:3000 `
	-v ${PWD}\.env:/env/.env:ro `
	-e APP_ENV_PATH=/env/.env `
	--name tourist-backend `
	tourist-backend:latest
```

3) Run with `docker-compose` (starts app + MongoDB):

```powershell
docker-compose up --build
```

Notes:
- The image's entrypoint supports providing an env file at `/run/secrets/app_env` (useful with Docker secrets) or `/env/.env` (bind-mount). The entrypoint copies that file to the app root as `.env` before starting.
- The compose file sets `DB_URL=mongodb://mongo:27017/tourist-safety` so the backend can connect to the `mongo` service.

## Pulling from Docker Hub
If you pushed an image to Docker Hub , you can pull and run it directly:

```powershell
docker pull redrepter/tourist-backend:latest
docker run --rm -p 3000:3000 `
	-e PORT=3000 `
	-e DB_URL="mongodb://host:27017/tourist-safety" `
	--name tourist-backend `
	redrepter/tourist-backend:latest
```

Or with a mounted `.env` as above (set `APP_ENV_PATH=/env/.env`).

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
