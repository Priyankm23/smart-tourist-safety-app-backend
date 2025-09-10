# Smart Tourist Safety Monitoring - Backend API Documentation

This backend provides APIs for managing tourist registration, login, and retrieving tourist information. All sensitive data is encrypted or hashed for security, and blockchain integration is used for audit purposes.

1.Registers a new tourist and creates a digital ID. Sensitive fields are encrypted, and a blockchain audit record is created.

**POST /auth/register**
Request Body:
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

Response (201 Created):

{
  "touristId": "T1694461234001",
  "message": "Registered. Digital ID created.",
  "audit": {
    "regHash": "<payload-hash>",
    "regTxHash": "<blockchain-tx-hash>",
    "eventId": "<event-id-hash>"
  }
}
---
2. Login Tourist

**POST /auth/login**
Request Body:

{
  "email": "john@example.com",
  "password": "StrongPass123"
}

Response (200 OK):

{
  "touristId": "T1694461234001",
  "message": "Login successful",
  "token": "<jwt-token>"
}
---
3. Get Tourist Information

**GET /tourist/:touristId**
Description: Retrieves the decrypted tourist information for the given touristId. Requires authentication via JWT token.
Response (200 OK):

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

Notes

All sensitive information (name, phone, email, itinerary, emergency contacts) is AES encrypted in the database.
govId is stored as a SHA256 hash for privacy.
Blockchain integration ensures auditability of registration records.
JWT token must be included in headers for all protected routes.

Technologies Used

Node.js + Express
MongoDB + Mongoose
AES Encryption & SHA256 hashing
Blockchain (Ethereum / Remix smart contract)
JWT Authentication
