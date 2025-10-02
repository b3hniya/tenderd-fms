import mongoose from "mongoose";
import dotenv from "dotenv";
import { SEED_VEHICLES } from "@tenderd-fms/core-types";
import chalk from "chalk";

dotenv.config();

/**
 * Vehicle Schema (inline for seeding)
 */
const VehicleSchema = new mongoose.Schema({
  _id: String,
  vin: { type: String, required: true, unique: true },
  licensePlate: { type: String, required: true, unique: true },
  vehicleModel: { type: String, required: true },
  manufacturer: { type: String, required: true },
  year: { type: Number, required: true },
  type: { type: String, required: true },
  fuelType: { type: String, required: true },
  status: { type: String, required: true },
  currentTelemetry: {
    type: {
      location: {
        type: { type: String, enum: ["Point"] },
        coordinates: [Number],
      },
      speed: Number,
      fuelLevel: Number,
      odometer: Number,
      engineTemp: Number,
      timestamp: Date,
    },
    required: false,
  },
  connectionStatus: { type: String, default: "OFFLINE" },
  lastSeenAt: Date,
  offlineSince: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Vehicle = mongoose.model("Vehicle", VehicleSchema, "vehicle");

/**
 * Seed vehicles into database
 */
async function seedVehicles() {
  try {
    console.log(chalk.cyan.bold("\n╔════════════════════════════════════════════════════════════════════════════╗"));
    console.log(chalk.cyan.bold("║                     🚗 VEHICLE SEEDER SCRIPT 🚗                          ║"));
    console.log(chalk.cyan.bold("╚════════════════════════════════════════════════════════════════════════════╝\n"));

    const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/tenderd-fms";
    console.log(chalk.yellow("📦 Connecting to MongoDB..."));
    console.log(chalk.gray(`   URI: ${mongoUri}\n`));

    await mongoose.connect(mongoUri);
    console.log(chalk.green("✅ Connected to MongoDB\n"));

    console.log(chalk.yellow("🧹 Clearing existing vehicles..."));
    const deleteResult = await Vehicle.deleteMany({});
    console.log(chalk.gray(`   Deleted: ${deleteResult.deletedCount} vehicles\n`));

    console.log(chalk.yellow(`🚗 Inserting ${SEED_VEHICLES.length} test vehicles...\n`));

    for (const vehicleData of SEED_VEHICLES) {
      const vehicle = new Vehicle({
        _id: vehicleData._id,
        vin: vehicleData.vin,
        licensePlate: vehicleData.licensePlate,
        vehicleModel: vehicleData.vehicleModel,
        manufacturer: vehicleData.manufacturer,
        year: vehicleData.year,
        type: vehicleData.type,
        fuelType: vehicleData.fuelType,
        status: vehicleData.status,
        connectionStatus: "OFFLINE",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await vehicle.save();
      console.log(
        chalk.green("  ✅") +
          chalk.white(` ${vehicleData.licensePlate.padEnd(15)}`) +
          chalk.gray(`${vehicleData.manufacturer} ${vehicleData.vehicleModel}`.padEnd(30)) +
          chalk.cyan(`ID: ${vehicleData._id}`)
      );
    }

    console.log();
    console.log(chalk.green.bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"));
    console.log(chalk.green.bold(`✅ Successfully seeded ${SEED_VEHICLES.length} vehicles!`));
    console.log(chalk.green.bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"));

    console.log(chalk.yellow("📋 Next Steps:"));
    console.log(chalk.gray("  1. Start API server: pnpm --filter @tenderd-fms/api dev"));
    console.log(chalk.gray("  2. Start IoT transmitter: pnpm --filter @tenderd-fms/iot-transmitter start"));
    console.log();

    await mongoose.disconnect();
    console.log(chalk.green("✅ Disconnected from MongoDB\n"));
  } catch (error) {
    console.error(chalk.red.bold("\n❌ Error seeding vehicles:\n"));
    console.error(chalk.red(error instanceof Error ? error.message : String(error)));
    console.error();
    process.exit(1);
  }
}

seedVehicles();
