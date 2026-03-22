# Smart Tourist Safety System Backend

Node.js backend for a proactive tourist and commuter safety platform with real-time risk intelligence, SOS orchestration, geofencing, group travel workflows, and blockchain-backed audit proof.

---

## Table of Contents

- Overview
- Core Capabilities
- Tech Stack
- Project Structure
- Quick Start
- Environment Variables
- API Endpoints (Feature-wise)
- Blockchain and QR Verification Flow
- Documentation
- Contributing
- License

---

## Overview

This backend is designed as a safety infrastructure layer, not just a single SOS API.

It supports:

- preventive alerts through dynamic risk grids
- emergency response with authority routing
- tourist identity and trip lifecycle management
- tamper-evident audit logging on Polygon
- scan-based verification using QR token flows

---

## Core Capabilities

- Tourist onboarding with encrypted personal fields
- Role-aware authentication for solo, group admin, and group members
- SOS trigger and live status lifecycle for authorities
- Geofence and danger-zone intelligence
- Dynamic risk scoring with scheduled recomputation
- Group itinerary and member management
- Blockchain proof for registration and SOS-linked audit records
- QR-based public verification page for basic tourist card plus blockchain trail

---

## Tech Stack

- Runtime: Node.js
- Framework: Express.js
- Database: MongoDB + Mongoose
- Auth: JWT
- Encryption and Hashing: AES + SHA-256
- Blockchain: Polygon via ethers.js
- Real-time: Socket.IO
- Background jobs: node-cron
- Logging: Morgan + Winston

---

## Project Structure

- app.js: server bootstrap and middleware wiring
- config: env and DB connection
- controllers: API handlers
- models: MongoDB schema layer
- routes: feature route mapping
- services: blockchain, risk engine, realtime, notifications
- utils: crypto and formatting helpers
- docs: architecture and implementation guides

---

## Quick Start

### 1) Install Dependencies

npm install

### 2) Configure Environment

Create a .env file in project root.

### 3) Run

Development:

npm run dev

Production:

npm start

Server starts on configured PORT.

---

## Environment Variables

Minimum required keys:

- PORT
- DB_URL
- JWT_SECRET
- JWT_EXPIRES_IN
- GOVID_SALT
- ENCRYPTION_KEY
- PRIVATE_KEY
- POLYGON_RPC
- SMART_CONTRACT_ADDRESS_reg
- SMART_CONTRACT_ADDRESS_sos

Recommended keys:

- SERVER_URL
- NODE_ENV
- MAPBOX_ACCESS_TOKEN
- RESEND_API_KEY
- FROM_EMAIL
- REDIS_HOST
- REDIS_PORT

Example:

PORT=3000
DB_URL=mongodb://localhost:27017/tourist-safety
JWT_SECRET=replace_me
JWT_EXPIRES_IN=7d
GOVID_SALT=replace_me
ENCRYPTION_KEY=32_byte_hex_key
PRIVATE_KEY=0x_wallet_private_key
POLYGON_RPC=https://rpc-amoy.polygon.technology
SMART_CONTRACT_ADDRESS_reg=0x_registration_contract
SMART_CONTRACT_ADDRESS_sos=0x_sos_contract
SERVER_URL=https://your-public-backend-domain
NODE_ENV=development

---

## API Endpoints (Feature-wise)

Below tables are grouped by feature ownership. The Description column explains feature purpose and primary user role, not per-endpoint payload detail.

### Authentication and Identity

| Feature                         | Description                                                                                              | Owner                               | Endpoints                                                                      |
| ------------------------------- | -------------------------------------------------------------------------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------ |
| Tourist account authentication  | Handles tourist registration and login lifecycle with role-aware access modes.                           | Tourist, Group Member               | POST /api/auth/register, POST /api/auth/login, POST /api/auth/login-with-codes |
| Registration proof verification | Confirms blockchain registration integrity for a tourist record.                                         | Authority, Auditor, System          | GET /api/auth/verify/:touristId                                                |
| QR verification experience      | Generates QR and serves scan-ready verification page with basic tourist card and blockchain audit trail. | Tourist, Authority, Public Verifier | GET /api/auth/qr/:touristId, GET /api/auth/qr/scan/:token                      |

### Tourist Profile and Personal Data

| Feature                    | Description                                                        | Owner            | Endpoints           |
| -------------------------- | ------------------------------------------------------------------ | ---------------- | ------------------- |
| Tourist profile access     | Provides authenticated tourist identity and trip state visibility. | Tourist          | GET /api/tourist/me |
| Tourist listing and lookup | Supports management-oriented read operations for tourist records.  | Admin, Authority | GET /api/tourist/   |

### SOS Emergency Management

| Feature                  | Description                                                                               | Owner     | Endpoints                                                                                                                                    |
| ------------------------ | ----------------------------------------------------------------------------------------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| SOS incident trigger     | Creates emergency alert workflow with response tracking and downstream authority actions. | Tourist   | POST /api/sos/trigger                                                                                                                        |
| Authority SOS operations | Allows authorities to view, assign, and resolve live SOS workload.                        | Authority | GET /api/authority/alerts, GET /api/authority/alerts/responding, PUT /api/authority/alerts/:id/assign, PUT /api/authority/alerts/:id/resolve |

### Risk, Geofence, and Zone Intelligence

| Feature                         | Description                                                                                     | Owner                    | Endpoints                                                                                                                                                          |
| ------------------------------- | ----------------------------------------------------------------------------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Unified zone visualization      | Returns danger zones, dynamic risk grids, and geofences with visual metadata for map rendering. | Mobile and Web Frontend  | GET /api/geofence/all-zones-styled                                                                                                                                 |
| Geofence and zone operations    | Manages static and destination zones plus transition ingestion and zone retrieval.              | Authority, Service Layer | GET /api/geofence/, GET /api/geofence/destinations, POST /api/geofence/destination, POST /api/geofence/zone, POST /api/geofence/transitions, GET /api/geofence/:id |
| Risk updates and analytics feed | Exposes dynamic risk data and update triggers for safety scoring systems.                       | Risk Engine, Authority   | GET /api/geofence/dynamic, POST /api/geofence/risk/update, GET /api/geofence/count                                                                                 |

### Tour Group and Member Management

| Feature                     | Description                                                                 | Owner      | Endpoints                                                                                                                                                                                                                        |
| --------------------------- | --------------------------------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tour group lifecycle        | Creates and manages group-level travel context and shared plans.            | Tour Admin | POST /api/group/create, POST /api/group/join, GET /api/group/dashboard, PUT /api/group/update                                                                                                                                    |
| Group member administration | Handles member add, bulk add, update, delete, and communication operations. | Tour Admin | GET /api/group/members, POST /api/group/members, POST /api/group/members/bulk, GET /api/group/members/:memberId, PUT /api/group/members/:memberId, DELETE /api/group/members/:memberId, POST /api/group/members/send-welcome-all |

### Itinerary Management

| Feature                | Description                                                    | Owner        | Endpoints                                                                                                                    |
| ---------------------- | -------------------------------------------------------------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| Solo itinerary control | CRUD-like controls for solo traveler day-wise itinerary state. | Solo Tourist | GET /api/itinerary/, POST /api/itinerary/:id, PUT /api/itinerary/, PUT /api/itinerary/day/:dayNumber, DELETE /api/itinerary/ |

### Authority and Operations Dashboard

| Feature                       | Description                                                                            | Owner     | Endpoints                                                                                                                                                                         |
| ----------------------------- | -------------------------------------------------------------------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Authority access and identity | Authority signup, login, and self-profile flows.                                       | Authority | POST /api/authority/signup, POST /api/authority/login, GET /api/authority/me                                                                                                      |
| Authority command dashboard   | Provides operational stats, map overview, tourism management, and revocation controls. | Authority | GET /api/authority/dashboard-stats, GET /api/authority/tourist-management, GET /api/authority/expired-tourists, GET /api/authority/map-overview, DELETE /api/authority/revoke/:id |
| Authority analytics           | Forecast and profiling insights for proactive decision-making.                         | Authority | GET /api/authority/analytics/crowd-prediction, GET /api/authority/analytics/medical-profiling                                                                                     |

### Incident Reporting

| Feature                       | Description                                                                 | Owner                        | Endpoints           |
| ----------------------------- | --------------------------------------------------------------------------- | ---------------------------- | ------------------- |
| Crowdsourced incident capture | Receives field incidents used by risk engine and authority awareness tools. | Tourist, Commuter, Authority | POST /api/incidents |

---

## Blockchain and QR Verification Flow

- Registration creates deterministic payload hash and event ID.
- Hash proof is written on Polygon and tx reference is stored in tourist audit block.
- QR endpoint signs a verification token and generates a QR image.
- Scan endpoint verifies blockchain proof and renders a human-readable ID card page.
- Endpoint also supports JSON mode for tooling by adding query parameter format=json.

For deep implementation details, use:

- docs/BLOCKCHAIN_LOGGING_COMPLETE_GUIDE.md

---

## Documentation

- docs/API_CONTRACT.md
- docs/BLOCKCHAIN_LOGGING_COMPLETE_GUIDE.md
- docs/FINAL_SRS.md
- docs/dynamic-danger-zone.md
- docs/Zone_Visual_Differentiation.md
- docs/REALTIME_WEBSOCKET_PLAN.md

---

## Contributing

1. Create a feature branch
2. Implement and test changes
3. Open pull request with clear scope and test notes

---

## License

Academic and research use for smart city safety initiatives.
