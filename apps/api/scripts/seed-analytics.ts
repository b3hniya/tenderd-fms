import mongoose from "mongoose";
import dotenv from "dotenv";
import { SEED_VEHICLES } from "@tenderd-fms/core-types";
import chalk from "chalk";

dotenv.config();

/**
 * Daily Analytics Schema (inline for seeding)
 */
const DailyAnalyticsSchema = new mongoose.Schema(
  {
    vehicleId: {
      type: String,
      required: true,
      ref: "Vehicle",
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    distanceTraveled: {
      type: Number,
      default: 0,
      min: 0,
    },
    hoursOperated: {
      type: Number,
      default: 0,
      min: 0,
    },
    hoursIdle: {
      type: Number,
      default: 0,
      min: 0,
    },
    averageSpeed: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxSpeed: {
      type: Number,
      default: 0,
      min: 0,
    },
    fuelConsumed: {
      type: Number,
      default: 0,
      min: 0,
    },
    fuelEfficiency: {
      type: Number,
      default: 0,
      min: 0,
    },
    averageEngineTemp: {
      type: Number,
      default: 0,
    },
    maxEngineTemp: {
      type: Number,
      default: 0,
    },
    tripCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    dataPoints: {
      type: Number,
      default: 0,
      min: 0,
    },
    validDataPoints: {
      type: Number,
      default: 0,
      min: 0,
    },
    dataQuality: {
      type: Number,
      default: 100,
      min: 0,
      max: 100,
    },
    calculatedAt: {
      type: Date,
      default: Date.now,
    },
    recalculatedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    collection: "daily_analytics",
  }
);

DailyAnalyticsSchema.index({ vehicleId: 1, date: 1 }, { unique: true });

const DailyAnalytics = mongoose.model("DailyAnalytics", DailyAnalyticsSchema, "daily_analytics");

/**
 * Generate random number between min and max
 */
function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/**
 * Generate random integer between min and max (inclusive)
 */
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate realistic analytics data for a given date
 * Includes some variability and realistic patterns
 */
function generateDailyAnalytics(vehicleId: string, date: Date) {
  // Simulate weekends having less activity (20% chance of no operation)
  const dayOfWeek = date.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const isInactive = isWeekend && Math.random() < 0.2;

  if (isInactive) {
    // Vehicle didn't operate this day
    return {
      vehicleId,
      date,
      distanceTraveled: 0,
      hoursOperated: 0,
      hoursIdle: 0,
      averageSpeed: 0,
      maxSpeed: 0,
      fuelConsumed: 0,
      fuelEfficiency: 0,
      averageEngineTemp: 0,
      maxEngineTemp: 0,
      tripCount: 0,
      dataPoints: 0,
      validDataPoints: 0,
      dataQuality: 100,
      calculatedAt: new Date(),
      recalculatedCount: 0,
    };
  }

  // Generate realistic operating hours (4-12 hours per day)
  const hoursOperated = randomBetween(4, 12);
  const hoursIdle = randomBetween(0.5, 2);

  // Distance traveled (100-500 km per day when operating)
  const distanceTraveled = randomBetween(100, 500);

  // Average speed (30-70 km/h)
  const averageSpeed = randomBetween(30, 70);

  // Max speed (60-120 km/h)
  const maxSpeed = randomBetween(Math.max(60, averageSpeed + 10), 120);

  // Fuel consumed (varies by vehicle type and distance)
  // Roughly 15-40 liters per 100km
  const fuelPer100km = randomBetween(15, 40);
  const fuelConsumed = (distanceTraveled / 100) * fuelPer100km;

  // Fuel efficiency (km per liter)
  const fuelEfficiency = distanceTraveled / fuelConsumed;

  // Engine temperature (normal operating range)
  const averageEngineTemp = randomBetween(85, 95);
  const maxEngineTemp = randomBetween(averageEngineTemp + 5, 105);

  // Number of trips (1-8 trips per day)
  const tripCount = randomInt(1, 8);

  // Data points (telemetry records - roughly 1 per minute when operating)
  const dataPoints = Math.floor(hoursOperated * 60 * randomBetween(0.8, 1.2));

  // Data quality (85-100%)
  const dataQualityPercent = randomBetween(85, 100);
  const validDataPoints = Math.floor(dataPoints * (dataQualityPercent / 100));

  return {
    vehicleId,
    date,
    distanceTraveled: Math.round(distanceTraveled * 100) / 100,
    hoursOperated: Math.round(hoursOperated * 100) / 100,
    hoursIdle: Math.round(hoursIdle * 100) / 100,
    averageSpeed: Math.round(averageSpeed * 100) / 100,
    maxSpeed: Math.round(maxSpeed * 100) / 100,
    fuelConsumed: Math.round(fuelConsumed * 100) / 100,
    fuelEfficiency: Math.round(fuelEfficiency * 100) / 100,
    averageEngineTemp: Math.round(averageEngineTemp * 100) / 100,
    maxEngineTemp: Math.round(maxEngineTemp * 100) / 100,
    tripCount,
    dataPoints,
    validDataPoints,
    dataQuality: Math.round(dataQualityPercent * 100) / 100,
    calculatedAt: new Date(),
    recalculatedCount: 0,
  };
}

/**
 * Get all dates between start and end (inclusive)
 */
function getDateRange(startDate: Date, endDate: Date): Date[] {
  const dates: Date[] = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
}

/**
 * Seed analytics data into database
 */
async function seedAnalytics() {
  try {
    console.log(chalk.cyan.bold("\n╔════════════════════════════════════════════════════════════════════════════╗"));
    console.log(chalk.cyan.bold("║                   📊 ANALYTICS SEEDER SCRIPT 📊                          ║"));
    console.log(chalk.cyan.bold("╚════════════════════════════════════════════════════════════════════════════╝\n"));

    const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/tenderd-fms";
    console.log(chalk.yellow("📦 Connecting to MongoDB..."));
    console.log(chalk.gray(`   URI: ${mongoUri}\n`));

    await mongoose.connect(mongoUri);
    console.log(chalk.green("✅ Connected to MongoDB\n"));

    // Define date range: October 1, 2024 to October 1, 2025
    const startDate = new Date(2024, 9, 1); // Month is 0-indexed (9 = October)
    const endDate = new Date(2025, 9, 1);

    const dates = getDateRange(startDate, endDate);
    const totalRecords = SEED_VEHICLES.length * dates.length;

    console.log(chalk.yellow("📅 Date Range:"));
    console.log(chalk.gray(`   Start: ${startDate.toISOString().split("T")[0]}`));
    console.log(chalk.gray(`   End:   ${endDate.toISOString().split("T")[0]}`));
    console.log(chalk.gray(`   Days:  ${dates.length}\n`));

    console.log(chalk.yellow("🚗 Vehicles:"));
    console.log(chalk.gray(`   Count: ${SEED_VEHICLES.length}\n`));

    console.log(chalk.yellow("📊 Total Records:"));
    console.log(
      chalk.gray(`   ${totalRecords.toLocaleString()} (${SEED_VEHICLES.length} vehicles × ${dates.length} days)\n`)
    );

    console.log(chalk.yellow("🧹 Clearing existing analytics..."));
    const deleteResult = await DailyAnalytics.deleteMany({});
    console.log(chalk.gray(`   Deleted: ${deleteResult.deletedCount} records\n`));

    console.log(chalk.yellow("📊 Generating analytics data...\n"));

    let insertedCount = 0;
    const batchSize = 1000;
    let batch: any[] = [];

    for (const vehicle of SEED_VEHICLES) {
      console.log(chalk.cyan(`   Processing: ${vehicle.licensePlate} (${vehicle._id})`));

      for (const date of dates) {
        const analyticsData = generateDailyAnalytics(vehicle._id, date);
        batch.push(analyticsData);

        if (batch.length >= batchSize) {
          await DailyAnalytics.insertMany(batch);
          insertedCount += batch.length;
          console.log(
            chalk.gray(`     Inserted ${insertedCount.toLocaleString()} / ${totalRecords.toLocaleString()} records...`)
          );
          batch = [];
        }
      }
    }

    // Insert remaining records
    if (batch.length > 0) {
      await DailyAnalytics.insertMany(batch);
      insertedCount += batch.length;
    }

    console.log();
    console.log(chalk.green.bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"));
    console.log(chalk.green.bold(`✅ Successfully seeded ${insertedCount.toLocaleString()} analytics records!`));
    console.log(chalk.green.bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"));

    console.log(chalk.yellow("📋 Summary:"));
    console.log(chalk.gray(`  Vehicles:       ${SEED_VEHICLES.length}`));
    console.log(
      chalk.gray(`  Date range:     ${startDate.toISOString().split("T")[0]} to ${endDate.toISOString().split("T")[0]}`)
    );
    console.log(chalk.gray(`  Days:           ${dates.length}`));
    console.log(chalk.gray(`  Total records:  ${insertedCount.toLocaleString()}`));
    console.log();

    console.log(chalk.yellow("📋 Next Steps:"));
    console.log(chalk.gray("  1. View analytics via API: GET /api/analytics/daily"));
    console.log(chalk.gray("  2. Query by vehicle: GET /api/analytics/daily?vehicleId=670000000000000000000001"));
    console.log(chalk.gray("  3. Start analytics dashboard: pnpm --filter @tenderd-fms/portal dev"));
    console.log();

    await mongoose.disconnect();
    console.log(chalk.green("✅ Disconnected from MongoDB\n"));
  } catch (error) {
    console.error(chalk.red.bold("\n❌ Error seeding analytics:\n"));
    console.error(chalk.red(error instanceof Error ? error.message : String(error)));
    console.error();
    process.exit(1);
  }
}

seedAnalytics();
