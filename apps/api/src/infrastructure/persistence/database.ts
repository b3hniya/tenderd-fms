import mongoose from "mongoose";
import logger from "../configs/logger";
import { createTelemetryCollection } from "../../modules/telemetry/models/telemetry";

const createTimeSeriesCollections = async (db: any) => {
  if (db) {
    await createTelemetryCollection(db);
  }
};

export async function connectDatabase(): Promise<void> {
  try {
    const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/fleet-management";
    await mongoose.connect(mongoUri);
    logger.info("✅ MongoDB connected successfully");

    const db = mongoose.connection.db;
    await createTimeSeriesCollections(db);
  } catch (error) {
    logger.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
}

mongoose.connection.on("disconnected", () => {
  logger.warn("⚠️  MongoDB disconnected");
});

mongoose.connection.on("error", (error) => {
  logger.error("❌ MongoDB error:", error);
});
