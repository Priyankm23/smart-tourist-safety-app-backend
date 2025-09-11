const socketio = require('socket.io');
const { handleSOSFallback } = require('./fallbackService');
const { logAlertToBlockchain } = require('./blockchainService');

let io; // This will hold the Socket.IO server instance
let authoritySockets = new Map(); // Map to store connected authorities

/**
 * Initializes the Socket.IO server and attaches it to the HTTP server.
 * @param {object} httpServer The Node.js HTTP server instance.
 */
exports.init = (httpServer) => {
  io = socketio(httpServer, {
    cors: {
      origin: "*", // Adjust for specific origins in production
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log(`New client connected: ${socket.id}`);

    // Store the socket if it's an authority, based on a handshake payload
    socket.on('registerAuthority', (data) => {
      if (data && data.role === 'authority' && data.userId) {
        authoritySockets.set(data.userId, socket);
        console.log(`Authority ${data.userId} registered with socket ${socket.id}`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
      // Remove the authority's socket from the map on disconnect
      for (let [userId, sock] of authoritySockets.entries()) {
        if (sock.id === socket.id) {
          authoritySockets.delete(userId);
          break;
        }
      }
    });
  });
};

/**
 * Emits a new SOS alert to all connected authorities.
 * This is the primary function for real-time alert broadcasting.
 * @param {object} alertData The alert data to be broadcasted.
 */
exports.emitSOSAlert = async (alertData) => {
  if (!io) {
    console.error("Socket.IO not initialized. Falling back to persistence.");
    return await handleSOSFallback(alertData);
  }

  // Iterate over all connected authority sockets and emit the alert
  if (authoritySockets.size === 0) {
    console.warn("No authorities are currently connected. Handling with fallback service.");
    await handleSOSFallback(alertData);
  } else {
    try {
      io.to([...authoritySockets.values()].map(s => s.id)).emit('newSOSAlert', alertData);
      console.log(`SOS alert broadcasted to ${authoritySockets.size} authorities.`);
      // Also log to the blockchain after successful real-time transmission
      await logAlertToBlockchain(alertData.alertId, alertData);
    } catch (error) {
      console.error("Failed to broadcast alert in real-time. Falling back:", error);
      await handleSOSFallback(alertData);
    }
  }
};