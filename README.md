# Smart Tourist Safety Monitoring - Backend API Documentation

This backend provides APIs for managing tourist registration, login, and retrieving tourist information. All sensitive data is encrypted or hashed for security, and blockchain integration is used for audit purposes.

---

## 1. Register Tourist

**Endpoint:**

```
POST /auth/register
```

**Request Body:**

```json
{
  "name": "John Doe",
  "govId": "A123456789",
  "phone": "9876543210",
  "email": "john@example.com",
  "password": "StrongPass123",
  "itinerary": ["Hotel ABC", "City Tour", "Museum Visit"],
  "emergencyContact": { "name": "Jane Doe", "phone": "9876543211" },
  "language": "en",
  "tripEndDate": "2025-10-01"
}
```

**Response (201 Created):**

```json
{
  "touristId": "T1694461234001",
  "message": "Registered. Digital ID created.",
  "audit": {
    "regHash": "<payload-hash>",
    "regTxHash": "<blockchain-tx-hash>",
    "eventId": "<event-id-hash>"
  }
}
```

---

## 2. Login Tourist

**Endpoint:**

```
POST /auth/login
```

**Request Body:**

```json
{
  "email": "john@example.com",
  "password": "StrongPass123"
}
```

**Response (200 OK):**

```json
{
  "touristId": "T1694461234001",
  "message": "Login successful",
  "token": "<jwt-token>"
}
```

---

## 3. Get Tourist Information

**Endpoint:**

```
GET /tourist/:touristId
```

**Headers:**

```
Authorization: Bearer <jwt-token>
```

**Response (200 OK):**

```json
{
  "touristId": "T1694461234001",
  "name": "John Doe",
  "phone": "9876543210",
  "email": "john@example.com",
  "itinerary": ["Hotel ABC", "City Tour", "Museum Visit"],
  "emergencyContact": { "name": "Jane Doe", "phone": "9876543211" },
  "language": "en",
  "safetyScore": 100,
  "consent": { "tracking": false, "dataRetention": true },
  "createdAt": "2025-09-11T12:00:00.000Z",
  "expiresAt": "2025-10-01T00:00:00.000Z",
  "audit": {
    "regHash": "<payload-hash>",
    "regTxHash": "<blockchain-tx-hash>"
  }
}
```

---

## 4. Trigger SOS Alert

**Endpoint:**

```
POST /sos/trigger
```

**Headers:**

```
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "location": {
    "coordinates": [80.1833, 16.3067],
    "locationName": "Andhra Pradesh Coast"
  },
  "safetyScore": 85,
  "sosReason": {
    "reason": "Cyclone warning",
    "weatherInfo": "Heavy rain expected",
    "extra": "Move to safer zone immediately"
  }
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "SOS alert triggered successfully",
  "sosAlert": {
    "id": "68c305fa481b6fc794e62b70",
    "status": "new",
    "location": {
      "coordinates": [80.1833, 16.3067],
      "locationName": "Andhra Pradesh Coast"
    },
    "timestamp": "2025-09-11T17:25:14.757Z",
    "blockchainTxHash": "0x123abc456..."
  }
}
```

---

## 5. Get New SOS Alerts

**Endpoint:**

```
GET /sos/alerts
```

**Headers:**

```
Authorization: Bearer <jwt-token>
```

**Response (200 OK):**

```json
[
  {
    "id": "68c305fa481b6fc794e62b70",
    "touristId": "68c2c68bd03e438eca88fa4f",
    "status": "new",
    "location": {
      "coordinates": [80.1833, 16.3067],
      "locationName": "Andhra Pradesh Coast"
    },
    "safetyScore": 85,
    "sosReason": {
      "reason": "Cyclone warning",
      "weatherInfo": "Heavy rain expected",
      "extra": "Move to safer zone immediately"
    },
    "emergencyContact": {
      "name": "Jane Doe",
      "phone": "9876543211"
    },
    "timestamp": "2025-09-11T17:25:14.757Z",
    "isLoggedOnChain": true,
    "blockchainTxHash": "0x123abc456..."
  }
]
```

---

## 6. Danger Zones (Geo-Fencing)

### a) Create Danger Zone

**Endpoint:**

```
POST /zone
```

**Request Body:**

```json
{
  "id": "disaster-0",
  "name": "Andhra Pradesh Coast",
  "type": "circle",
  "coords": [16.3067, 80.1833],
  "radiusKm": 5,
  "category": "Natural Disaster Risk Area",
  "state": "Andhra Pradesh",
  "riskLevel": "Very High",
  "source": "India Meteorological Department",
  "raw": {
    "Name": "Andhra Pradesh Coast",
    "Category": "Natural Disaster Risk Area",
    "Sub_Category": "Cyclone Zone",
    "State": "Andhra Pradesh",
    "Latitude": "16.3067",
    "Longitude": "80.1833",
    "Area_km2": "",
    "Year_Established": "",
    "Source": "India Meteorological Department",
    "Additional_Info": "Risk Level: Very High"
  }
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "message": "Danger zone created successfully",
  "zone": {
    "id": "disaster-0",
    "name": "Andhra Pradesh Coast",
    "type": "circle",
    "coords": [16.3067, 80.1833],
    "radiusKm": 5,
    "category": "Natural Disaster Risk Area",
    "state": "Andhra Pradesh",
    "riskLevel": "Very High",
    "source": "India Meteorological Department"
  }
}
```

### b) Get All Danger Zones

**Endpoint:**

```
GET /zone
```

**Response (200 OK):**

```json
[
  {
    "id": "disaster-0",
    "name": "Andhra Pradesh Coast",
    "type": "circle",
    "coords": [16.3067, 80.1833],
    "radiusKm": 5,
    "category": "Natural Disaster Risk Area",
    "state": "Andhra Pradesh",
    "riskLevel": "Very High",
    "source": "India Meteorological Department"
  }
]
```

### c) Get Danger Zone By ID

**Endpoint:**

```
GET /zone/:id
```

**Response (200 OK):**

```json
{
  "id": "disaster-0",
  "name": "Andhra Pradesh Coast",
  "type": "circle",
  "coords": [16.3067, 80.1833],
  "radiusKm": 5,
  "category": "Natural Disaster Risk Area",
  "state": "Andhra Pradesh",
  "riskLevel": "Very High",
  "source": "India Meteorological Department",
  "raw": {
    "Name": "Andhra Pradesh Coast",
    "Category": "Natural Disaster Risk Area",
    "Sub_Category": "Cyclone Zone",
    "State": "Andhra Pradesh",
    "Latitude": "16.3067",
    "Longitude": "80.1833",
    "Area_km2": "",
    "Year_Established": "",
    "Source": "India Meteorological Department",
    "Additional_Info": "Risk Level: Very High"
  }
}

```


## Notes

* All sensitive information (name, phone, email, itinerary, emergency contacts) is **AES encrypted** in the database.
* `govId` is stored as a **SHA256 hash** for privacy.
* Blockchain integration ensures auditability of registration records.
* JWT token must be included in headers for all protected routes.

---

## Technologies Used

* Node.js + Express
* MongoDB + Mongoose
* AES Encryption & SHA256 hashing
* Blockchain (Ethereum / Remix smart contract)
* JWT Authentication
