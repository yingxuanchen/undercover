import { Server } from "socket.io";

let io;

export function initIO(httpServer) {
  io = new Server(httpServer);
  return io;
}

export function getIO() {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
}
