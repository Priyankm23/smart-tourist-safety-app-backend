// const Redis = require('ioredis');
// const winston = require('winston');

// // Initialize Redis client. Use environment variables for production.
// const redisClient = new Redis({
//   port: 6379,
//   host: '127.0.0.1',
// });

// // Configure Winston logger to log to console and a file
// const logger = winston.createLogger({
//   level: 'info',
//   format: winston.format.combine(
//     winston.format.timestamp(),
//     winston.format.json()
//   ),
//   transports: [
//     new winston.transports.Console(),
//     new winston.transports.File({ filename: 'logs/fallback.log' }),
//   ],
// });

// /**
//  * Handles the fallback logic for an SOS alert.
//  * If the real-time channel (e.g., Socket.IO) is unavailable, it stores the alert in Redis.
//  * @param {object} alertData The SOS alert data.
//  */
// exports.handleSOSFallback = async (alertData) => {
//   try {
//     const alertId = alertData.alertId;
//     const alertKey = `sos:fallback:${alertId}`;

//     // Store the entire alert object as a JSON string in Redis
//     await redisClient.set(alertKey, JSON.stringify(alertData));
//     await redisClient.expire(alertKey, 3600); // Expire the key after 1 hour

//     logger.warn(`Real-time channel down. Storing alert ${alertId} in Redis for fallback.`);

//   } catch (error) {
//     logger.error(`Failed to handle SOS fallback for alert ${alertData.alertId}:`, error);
//   }
// };

// /**
//  * Retrieves a pending alert from the Redis fallback queue.
//  * @param {string} alertId The ID of the alert to retrieve.
//  * @returns {Promise<object|null>} The alert data or null if not found.
//  */
// exports.getPendingAlert = async (alertId) => {
//   try {
//     const alertKey = `sos:fallback:${alertId}`;
//     const alertData = await redisClient.get(alertKey);

//     if (alertData) {
//       // Delete the key from Redis after retrieval to avoid reprocessing
//       await redisClient.del(alertKey);
//       return JSON.parse(alertData);
//     }
//     return null;
//   } catch (error) {
//     logger.error(`Failed to retrieve pending alert ${alertId}:`, error);
//     return null;
//   }
// };