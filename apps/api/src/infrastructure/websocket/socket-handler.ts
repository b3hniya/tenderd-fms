import { Server } from "socket.io";
import http from "http";
import { Express } from "express";
import logger from "../configs/logger";

export function setupSocketIO(app: Express) {
  const server = http.createServer(app);

  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:3001",
      credentials: false,
    },
  });

  io.on("connection", (socket) => {
    logger.info(`✅ Client connected: ${socket.id}`);

    socket.on("disconnect", () => {
      logger.info(`❌ Client disconnected: ${socket.id}`);
    });
  });

  (global as any).io = io;

  return { server, io };
}
