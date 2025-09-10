POST /api/auth/register -
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

POST /api/auth/login - 
{
  "email": "john@example.com",
  "password": "StrongPass123"
}

GET /api/tourist/:touristid - 
{
   tourist information
}
