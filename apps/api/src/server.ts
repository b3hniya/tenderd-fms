import "reflect-metadata";
import dotenv from "dotenv";
import createApp from "./app";
import validateEnv from "./infrastructure/utils/validate-env";
import logger from "./infrastructure/configs/logger";
import { connectDatabase } from "./infrastructure/persistence/database";
import { setupSocketIO } from "./infrastructure/websocket/socket-handler";

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
    await connectDatabase();

    const app = await createApp();

    const { server } = setupSocketIO(app);

    const PORT = process.env.PORT || 4000;

    server.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
    });
  } catch (error) {
    logger.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

bootstrap();
