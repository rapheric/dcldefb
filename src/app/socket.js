
// socket.js
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

const socket = io(SOCKET_URL, {
  autoConnect: false, // IMPORTANT
  transports: ["websocket", "polling"],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

/* ===========================
   DEBUG LOGS
=========================== */
socket.on("connect", () => {
  console.log("🟢 WebSocket connected:", socket.id);
});

socket.on("disconnect", (reason) => {
  console.log("🔴 WebSocket disconnected:", reason);
});

socket.on("connect_error", (err) => {
  console.error("⚠️ WebSocket error:", err.message);
});

/* ===========================
   HELPERS
=========================== */
export const connectSocket = () => {
  if (!socket.connected) socket.connect();
};

export const disconnectSocket = () => {
  if (socket.connected) socket.disconnect();
};

export const emitUserOnline = (user) => {
  if (!user?._id) return;

  connectSocket();

  socket.emit("userOnline", {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
  });
};

export default socket;
