import { Server } from "socket.io";
import { allowedOrigins } from "../index.js";

let io;

export function initIO(httpServer) {
  io = new Server(httpServer, {
    cors: {
      credentials: true,
      origin: allowedOrigins,
    },
  });
  return io;
}

export function getIO() {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
}
