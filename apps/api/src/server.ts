import "reflect-metadata";
import dotenv from "dotenv";
import createApp from "./app";
import validateEnv from "./infrastructure/utils/validate-env";
import logger from "./infrastructure/configs/logger";
import { connectDatabase } from "./infrastructure/persistence/database";
import { setupSocketIO } from "./infrastructure/websocket/socket-handler";
import { jobManager } from "./infrastructure/jobs/job-manager";
import { ConnectionMonitorService } from "./infrastructure/jobs/connection-monitor.service";

dotenv.config();
validateEnv();

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception:", error);
});

const bootstrap = async () => {
  try {
    console.log("🚀 Starting bootstrap...");

    console.log("📦 Connecting to database...");
    await connectDatabase();
    console.log("✅ Database connection completed");

    console.log("🔧 Creating app...");
    const app = await createApp();
    console.log("✅ App created");

    console.log("🔌 Setting up Socket.IO...");
    const { server } = setupSocketIO(app);
    console.log("✅ Socket.IO setup complete");

    console.log("⏰ Registering background jobs...");
    const connectionMonitor = new ConnectionMonitorService();
    jobManager.register(connectionMonitor);
    jobManager.startAll();
    console.log("✅ Background jobs started");

    const PORT = process.env.PORT || 4000;

    server.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`📚 API Docs: http://localhost:${PORT}/api-docs`);
    });

    const shutdown = () => {
      logger.info("Shutting down gracefully...");
      jobManager.stopAll();
      server.close(() => {
        logger.info("Server closed");
        process.exit(0);
      });

      setTimeout(() => {
        logger.error("Forced shutdown");
        process.exit(1);
      }, 10000);
    };

    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);
  } catch (error) {
    console.error("❌ Bootstrap error:", error);
    logger.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

console.log("🎬 Starting application...");
bootstrap();
