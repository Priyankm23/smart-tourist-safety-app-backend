# SafeTrail — Smart Tourist Safety System · Backend

> A production-grade Node.js backend powering real-time tourist safety: dynamic risk scoring, geofencing, SOS management, tour group coordination, and blockchain-backed audit trails — serving both a React Native tourist app and a React authority command center from a single API.

**Live Authority Dashboard →** [authority.safetrail.in](https://authority.safetrail.in) &nbsp;·&nbsp; **Project Landing Page →** [safetrail.in](https://safetrail.in) &nbsp;·&nbsp; **Download APK →** [safetrail.in/#explore](https://safetrail.in/#explore)

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
│     Tourist App           │       │     Authority Dashboard        │
│     (React Native/Expo)   │       │     (React)                    │
│                           │       │                                │
│  • Map + Risk Zones       │       │  • Live Situation Map          │
│  • SOS Panic Button       │       │  • Tourist Heatmap             │
│  • Geofence Alerts        │       │  • SOS Management              │
│  • Tour Group View        │       │  • Unit Assignment             │
│  • Digital Tourist ID     │       │  • Tourist Profiles            │
└───────────┬───────────────┘       └────────────────┬──────────────┘
            │                                         │
            │         REST API + Socket.IO            │
            └─────────────────┬───────────────────────┘
                              │
            ┌─────────────────▼──────────────────────────────────┐
            │              Express.js API Server                   │
            │                                                      │
            │  ┌───────────────┐   ┌──────────────┐               │
            │  │ Auth & RBAC   │   │  Real-time   │               │
            │  │ JWT · 4 roles │   │  Socket.IO   │               │
            │  └───────────────┘   └──────────────┘               │
            │                                                      │
            │  ┌───────────────┐   ┌──────────────┐               │
            │  │  Risk Engine  │   │  Blockchain  │               │
            │  │  (background) │   │   Service    │               │
            │  └───────────────┘   └──────────────┘               │
            │                                                      │
            │  ┌───────────────┐   ┌──────────────┐               │
            │  │   News &      │   │   Fallback   │               │
            │  │   Alerts Svc  │   │   Service    │               │
            │  └───────────────┘   └──────────────┘               │
            └───────┬──────────────────────────┬───────────────────┘
                    │                          │
             ┌──────▼──────┐       ┌───────────▼────────────────┐
             │   MongoDB   │       │   Polygon L2 (Ethers.js)   │
             │   + Mongoose│       │   Blockchain Audit Trail   │
             └─────────────┘       └────────────────────────────┘
```

---

## Features

### Tourist App API

**Authentication & Digital Identity**
- Registration with government ID, emergency contacts, consent tracking, language preference, and trip end date
- JWT-based authentication with role-specific session payloads (`solo`, `tour-admin`, `group-member`)
- **Blockchain Digital ID** — every registration logs a Keccak-256 hashed record to Polygon L2 via Ethers.js, creating a tamper-proof tourist identity with an on-chain transaction hash returned at registration
- AES-256 encryption on all PII before storage — only hashes go on-chain
- Blockchain verification endpoint: confirms tourist identity against on-chain records

**SOS & Emergency Response**
- SOS trigger records location coordinates, current safety score snapshot, reason category, and weather context
- On trigger: broadcasts in real-time to all connected authority dashboards via Socket.IO
- Every SOS event logged to blockchain immediately — non-repudiable and undeletable
- **Fallback escalation service** — if an SOS alert goes unacknowledged by authorities, an automated escalation kicks in
- Authorities can assign response units (`unitId`, `unitType`) to active SOS alerts from the dashboard

**Dynamic Risk Engine (Background Service)**
- Runs as a background job on a 30-minute cycle — no manual trigger required
- Partitions the entire map into ~500m geographic grid cells (stored as `RiskGrid` documents)
- Each cell's risk score is calculated from: recent SOS alerts, crowdsourced incident reports, and time-decayed historical data
- On every tourist location update, computes a **real-time proximity-based safety score** using Haversine distance + stepped linear decay against surrounding risk cells
- Score (0–100) drives the tourist app UI state: green → yellow → red
- Manual recalculation trigger available via `POST /api/geofence/risk/update` for admin use

**Three-Layer Geofencing System**
- **Danger Zones** — static pre-seeded high-risk areas; solid border, diagonal stripe visual metadata
- **Risk Grids** — dynamic zones generated by the Risk Engine from incident clusters; dashed border, refreshed every 30 min
- **Destination Geofences** — auto-generated safe zones from tourist itinerary destinations, TTL-bound with auto-expiry; dotted blue border
- `GET /api/geofence/all-zones-styled` returns all three zone types with full visual styling metadata (borderStyle, fillPattern, renderPriority, color) ready for direct map rendering
- Client-side geofence entry/exit events are received via `POST /api/geofence/transitions` and processed for logging and alert generation

**Itinerary Management**
- Tourists set a day-wise itinerary of named destinations with coordinates
- Backend **auto-generates destination geofences** around each itinerary stop with TTL-based auto-expiry — no manual zone creation needed
- Full CRUD: create itinerary, replace entire itinerary, upsert a single day, clear itinerary
- Solo traveler itineraries are stored separately from tour group shared itineraries

**Crowdsourced Incident Reporting**
- Any authenticated tourist can report: `theft`, `assault`, `accident`, `riot`, `natural_disaster`, `other`
- Severity (0–1) and coordinates are stored and feed directly into the Risk Engine's next calculation cycle, affecting the relevant grid cell's score

**Tourist Profile & Stats**
- Full profile access: name, phone, email, emergency contacts, itinerary, language, trip dates, consent flags
- Authority-facing tourist list with filtering for monitoring and management

---

### Tour Group API

For guided tour operators and group travel administrators.

- **Create group** — generates a group record with day-wise shared itinerary, start/end dates, and a shareable `accessCode`
- **Join group** — tourist links their account as `group-member` under the `tour-admin`
- **Group dashboard** — admin sees all member safety data in one view
- **Member management** — full CRUD: add individual members, bulk import multiple members at once, update details, remove members
- **Bulk welcome emails** — send onboarding emails to all group members simultaneously via Nodemailer
- **Itinerary sync** — tour admin updates the group itinerary; geofences auto-regenerate for all linked members
- Group location data streams to the authority dashboard so authorities see group movements and can act on group-level SOS events

---

### Authority Dashboard API

For tourism police, emergency response units, and government authorities.

- **Separate auth** — authority accounts with `badgeNumber`, `departmentName`, and `isAuthority` role guard on all protected routes
- **Dashboard stats** — live counts: active SOS, total registered tourists, high-risk zone count, resolved incidents
- **Live SOS alerts feed** — real-time stream via Socket.IO; REST `GET /api/authority/alerts` for fallback polling
- **Alert assignment** — assign response unit by ID and type to active SOS alerts; tracked for accountability
- **Live map overview** — single endpoint returns all tourist locations, active danger zones, and live SOS positions for map rendering
- **Tourist management** — full directory with individual tourist profile access; authority can revoke accounts
- **SOS analytics** — total, active, and resolved SOS counts

---

### Real-time Layer (Socket.IO)

All time-sensitive features flow through the Socket.IO server:

| Event | Direction | Description |
|---|---|---|
| Tourist location | App → Server → Dashboard | Live map feed for authority |
| SOS trigger | App → Server → Dashboard | Instant alert + coordinates |
| Incident report | App → Server → Dashboard | Alert feed update |
| Geofence transition | App → Server | Entry/exit logging + alerts |
| Risk score update | Server → App | Drives UI safety status color |

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
| Email | Nodemailer |
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

| Repo | Stack | Description |
|---|---|---|
| `smart-tourist-safety-app-backend` | Node.js, Express, MongoDB | ← **This repo** |
| `tourist-app-frontend` | React Native, Expo, Mapbox | Tourist mobile app |
| `authority-dashboard-frontend` | React, Mapbox | Authority command center UI |
| `path-deviation-microservice` | FastAPI, Python | Path tracking & deviation alerts |

---

*Inspired by SIH Problem Statement ID: SIH25002 — Smart Tourist Safety, Monitoring & Incident Response System. Open source.*
