# SafeTrail — Smart Tourist Safety System · Backend

> A Node.js backend powering real-time tourist safety: dynamic risk scoring, geofencing, SOS management, tour group coordination, and blockchain-backed audit trails — serving both a React Native tourist app and a React authority command center from a single API.

**Live Authority Dashboard →** [Vercel Deployed Authority Dashboard](https://safetrail-authority-dashboard.vercel.app/) &nbsp;·&nbsp; **Project Landing Page →** [Safetrail - landing page](https://safetrail-your-safety-in-your-mobile.vercel.app/) &nbsp;·&nbsp; **Download APK →** [Safetrail APK](https://github.com/Meetpatel006/smart-safety/releases/download/v1.4.1/SmartSafety-1.4.1-release.apk)

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-black?style=flat-square&logo=express)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat-square&logo=mongodb&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-010101?style=flat-square&logo=socket.io)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white)
![Polygon](https://img.shields.io/badge/Polygon_L2-8247E5?style=flat-square&logo=polygon&logoColor=white)

---

## What is SafeTrail?

SafeTrail is a safety ecosystem for tourists — not just an SOS button. The system proactively warns tourists before they enter high-risk zones, streams real-time location data to an authority command center, coordinates tour group safety, and logs every critical event permanently on the Polygon blockchain.

This repository is the **Node.js backend** — the single API serving both the React Native tourist app and the React authority dashboard. Built in response to SIH Problem Statement ID: SIH25002 (Smart Tourist Safety, Monitoring & Incident Response System).

**Built by:** Priyank Moradiya (Node.js backend — API, Socket.IO, blockchain) &nbsp;·&nbsp; Meet Patel (frontend — React Native app, authority dashboard UI, FastAPI path microservice)  
4 repositories · 17+ APK releases · Open source

---

## System Architecture

```
   ┌──────────────────────────┐       ┌───────────────────────────────┐
   │   Tourist App            │       │    Authority Dashboard        │
   │   (React Native/Expo)    │       │    (React)                    │
   │                          │       │                               │
   │  • Map + Risk Zones      │       │  • Live Situation Map         │
   │  • SOS Panic Button      │       │  • Tourist Heatmap            │
   │  • Geofence Alerts       │       │  • SOS Management             │
   │  • Tour Group View       │       │  • Unit Assignment            │
   │  • Digital Touris ID     │       │  • Tourist Profile            │
   └───────────┬──────────────┘       └────────────────┬──────────────┘
               │                                       │
               │         REST API + Socket.IO          │
               └─────────────────┬─────────────────────┘
                                 │
            ┌────────────────────▼──────────────────────────────┐
            │              Express.js API Server                │
            │                                                   │
            │       ┌───────────────┐   ┌──────────────┐        │
            │       │ Auth & RBAC   │   │  Real-time   │        │
            │       │ JWT · 4 roles │   │  Socket.IO   │        │
            │       └───────────────┘   └──────────────┘        │
            │                                                   │
            │       ┌───────────────┐   ┌──────────────┐        │
            │       │  Risk Engine  │   │  Blockchain  │        │
            │       │  (background) │   │   Service    │        │
            │       └───────────────┘   └──────────────┘        │
            │                                                   │
            │       ┌───────────────┐   ┌──────────────┐        │
            │       │   News &      │   │   Fallback   │        │
            │       │   Alerts Svc  │   │   Service    │        │
            │       └───────────────┘   └──────────────┘        │
            └───────┬──────────────────────────┬────────────────┘
                    │                          │
             ┌──────▼──────┐       ┌───────────▼────────────────┐
             │   MongoDB   │       │   Polygon L2 (Ethers.js)   │
             │  + Mongoose │       │   Blockchain Audit Trail   │
             └─────────────┘       └────────────────────────────┘
```

## Features

### Tourist App API

**Auth & Digital Identity** — JWT auth with 4 roles (`solo`, `tour-admin`, `group-member`, `authority`). Registration logs a Keccak-256 hashed record to Polygon L2, creating a tamper-proof on-chain tourist identity. AES-256 encrypts all PII before storage.

**SOS & Emergency Response** — SOS trigger records location, safety score snapshot, and reason; broadcasts instantly to all connected authority dashboards via Socket.IO and logs to blockchain. A fallback escalation service re-escalates unacknowledged alerts automatically.

**Dynamic Risk Engine** — Background job on a 30-min cycle. Partitions the map into ~500m grid cells, scores each cell from recent SOS alerts, crowdsourced incidents, and time-decayed historical data. Computes a real-time proximity-based safety score per tourist using Haversine distance + stepped linear decay. Drives the app's green/yellow/red UI state.

**Three-Layer Geofencing** — Danger zones (static, pre-seeded), risk grids (dynamic, Risk Engine output), and destination geofences (auto-generated from itinerary with TTL-based expiry). `GET /api/geofence/all-zones-styled` returns all three with visual styling metadata for direct map rendering.

**Itinerary & Crowdsourcing** — Day-wise itinerary CRUD auto-generates destination geofences on save. Tourists can report incidents (`theft`, `assault`, `accident`, `riot`, `natural_disaster`, `other`) which feed into the next Risk Engine cycle.

---

### Tour Group API

Create groups with shared itineraries and a shareable `accessCode`. Members join via code. Tour admin gets a group dashboard with member safety data, full member CRUD, bulk import, and itinerary sync (geofences auto-regenerate on update). Bulk welcome emails via **Resend**.

---

### Authority Dashboard API

Separate auth with `badgeNumber` and `isAuthority` role guard. Provides: live SOS feed (Socket.IO + REST fallback), unit assignment to active alerts, live map overview (tourist locations + zones + active SOS), tourist directory with profile access, and dashboard stats (active SOS, total tourists, high-risk zone count).

---

### Real-time Layer (Socket.IO)

| Event | Direction | Description |
|---|---|---|
| Tourist location | App → Dashboard | Live map feed |
| SOS trigger | App → Dashboard | Instant alert + coordinates |
| Incident report | App → Dashboard | Alert feed update |
| Geofence transition | App → Server | Entry/exit logging |
| Risk score update | Server → App | UI safety state |

---

## Key Engineering Decisions

**Dynamic Risk Scoring over Static Zones** — Most safety apps use hand-drawn static zones. SafeTrail's Risk Engine recalculates scores every 30 minutes from actual incident and SOS data. A tourist entering an area with 3 theft reports today gets warned — even if it has never been manually flagged. Risk also decays over time if incidents stop, preventing permanent false positives.

**Blockchain Audit Trail** — Government accountability use case: SOS alerts and tourist registrations are logged to Polygon L2. The on-chain hash is a Keccak-256 of the event payload. If an authority disputes receiving an SOS, the blockchain says otherwise. AES-256 protects PII — only the hash goes on-chain.

**Itinerary-Driven Auto-Geofencing** — Instead of requiring administrators to draw safe zones, the backend auto-generates TTL-bound destination geofences from a tourist's itinerary. When a trip ends, zones auto-expire. The frontend just polls `GET /api/geofence/destinations` and renders what's active.

**Single Backend, Dual Client** — One Express server handles both the tourist app and the authority dashboard — differentiated entirely by JWT role. Role-specific middleware guards each route group. This keeps the codebase unified and forces a clean API contract.

**Fallback Escalation** — An unacknowledged SOS doesn't silently expire. The fallback service monitors active alerts and escalates if no authority acknowledges within a threshold, making the system resilient to dashboard downtime.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 18+ |
| Framework | Express.js |
| Database | MongoDB + Mongoose ODM |
| Real-time | Socket.IO |
| Blockchain | Polygon L2 via Ethers.js |
| Security | JWT, AES-256, bcryptjs |
| Logging | Winston, Morgan |
| Email | Resend |
| DevOps | Docker, Docker Compose, GitHub Actions |

---

## Project Structure

```
backend/
├── app.js
├── config/
│   ├── config.js                 # Environment config
│   └── dbConnection.js
├── controllers/
│   ├── authController.js         # Tourist registration + login
│   ├── authorityController.js    # Authority dashboard endpoints
│   ├── geofenceController.js     # Zone management + transition events
│   ├── incidentController.js     # Crowdsourced incident reporting
│   ├── itineraryController.js    # Itinerary CRUD
│   ├── SOSalertController.js     # SOS trigger + management
│   ├── tourGroupController.js    # Group create/join/member ops
│   ├── touristController.js      # Tourist profiles
│   └── verifyController.js       # Blockchain identity verification
├── middlewares/
│   ├── authMiddleware.js         # JWT verification + role guards
│   └── errorMiddleware.js
├── models/
│   ├── Tourist.js                # AES-256 encrypted PII fields
│   ├── Authority.js
│   ├── SOSalert.js
│   ├── Incident.js
│   ├── RiskGrid.js               # Geographic risk cells
│   ├── Geofence.js
│   └── TourGroup.js
├── routes/
├── services/
│   ├── riskEngineService.js      # 30-min background risk scorer
│   ├── blockchainService.js      # Polygon L2 event logger
│   ├── realtimeService.js        # Socket.IO event layer
│   ├── newsService.js            # Safety news aggregation
│   └── fallbackService.js        # Unacknowledged SOS escalation
├── tests/                        # Jest test suite
├── Dockerfile
├── docker-compose.yml
└── generate-geofences-for-existing.js
```

---

## Running Locally

**Prerequisites:** Node.js 18+, MongoDB (local or Atlas), Docker (optional)

```bash
git clone https://github.com/Priyankm23/smart-tourist-safety-app-backend.git
cd smart-tourist-safety-app-backend
npm install
```

Create `.env`:
```env
PORT=3000
DB_URL=mongodb://localhost:27017/tourist-safety
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
PRIVATE_KEY=your_ethereum_wallet_private_key
SMART_CONTRACT_ADDRESS_reg=your_registration_contract_address
SMART_CONTRACT_ADDRESS_sos=your_sos_contract_address
POLYGON_RPC=https://polygon-rpc.com
NODE_ENV=development
```

```bash
npm run dev     # Development (nodemon)
npm start       # Production
npm test        # Jest test suite
```

**Docker:**
```bash
docker-compose up --build

# or pull from Docker Hub
docker pull redrepter/tourist-backend:latest
docker run --rm -p 3000:3000 -e DB_URL="mongodb://host:27017/tourist-safety" redrepter/tourist-backend:latest
```

---

## API Overview

| Domain | Key Endpoints |
|---|---|
| Auth | `POST /api/auth/register` · `POST /api/auth/login` · `GET /api/auth/verify/:touristId` |
| Tourist | `GET /api/tourist/me` · `GET /api/tourist/` |
| SOS | `POST /api/sos/trigger` · real-time broadcast via Socket.IO |
| Incidents | `POST /api/incidents` |
| Geofence | `GET /api/geofence/all-zones-styled` · `GET /api/geofence/dynamic` · `POST /api/geofence/destination` · `POST /api/geofence/transitions` · `POST /api/geofence/risk/update` |
| Itinerary | `GET /api/itinerary/` · `PUT /api/itinerary/` · `PUT /api/itinerary/day/:dayNumber` · `DELETE /api/itinerary/` |
| Tour Group | `POST /api/group/create` · `POST /api/group/join` · `GET /api/group/dashboard` · `PUT /api/group/update` |
| Group Members | `GET/POST /api/group/members` · `POST /api/group/members/bulk` · `POST /api/group/members/send-welcome-all` · `GET/PUT/DELETE /api/group/members/:id` |
| Authority | `GET /api/authority/dashboard-stats` · `GET /api/authority/alerts` · `PUT /api/authority/alerts/:id/assign` · `GET /api/authority/map-overview` · `GET /api/authority/tourist-management` · `DELETE /api/authority/revoke/:id` |

Full contract: [`API_CONTRACT.md`](./API_CONTRACT.md) &nbsp;·&nbsp; SRS: [`FINAL_SRS.md`](./FINAL_SRS.md) &nbsp;·&nbsp; Risk Engine: [`dynamic-danger-zone.md`](./dynamic-danger-zone.md) &nbsp;·&nbsp; Frontend integration: [`FRONTEND_IMPLEMENTATION_GUIDE.md`](./FRONTEND_IMPLEMENTATION_GUIDE.md)

---

## Related Repositories

click on the repo column to navigate to the actual repos which are used for the project

| Repo | Stack | Description |
|---|---|---|
| `[tourist-safety-app-backend](https://github.com/Priyankm23/smart-tourist-safety-app-backend)` | Node.js, Express, MongoDB | ← **This repo** |
| `[tourist-safety-app-frontend](https://github.com/Meetpatel006/smart-safety)` | React Native, Expo, Mapbox | Tourist mobile app |
| `[authority-dashboard-frontend](https://github.com/Meetpatel006/authority-dashboard)` | React, Mapbox | Authority command center UI |
| `[path-deviation-microservice](https://github.com/Meetpatel006/path-deviation)` | FastAPI, Python | Path tracking & deviation alerts |

---

*Inspired by SIH Problem Statement ID: SIH25002 — Smart Tourist Safety, Monitoring & Incident Response System. Open source.*
