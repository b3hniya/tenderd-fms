import mongoose, { Document, Schema } from "mongoose";

export interface IDailyAnalytics extends Document {
  vehicleId: string;
  date: Date; 

  // Distance
  distanceTraveled: number; // km

  // Time
  hoursOperated: number; // hours (engine running)
  hoursIdle: number; // hours (engine on, speed = 0)

  // Speed
  averageSpeed: number; // km/h
  maxSpeed: number; // km/h

  // Fuel
  fuelConsumed: number; // liters
  fuelEfficiency: number; // km per liter

  // Engine
  averageEngineTemp: number; // celsius
  maxEngineTemp: number; // celsius

  // Trips
  tripCount: number; // Number of trips (engine on → off)

  // Data Quality
  dataPoints: number; // Number of telemetry records
  validDataPoints: number; // Number with contextValid=true
  dataQuality: number; // Percentage (validDataPoints / dataPoints)

  // Metadata
  calculatedAt: Date;
  recalculatedCount: number; // How many times recalculated (for late data)
}

const DailyAnalyticsSchema = new Schema<IDailyAnalytics>(
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
    collection: "analytics_daily",
  }
);

DailyAnalyticsSchema.index({ vehicleId: 1, date: 1 }, { unique: true });
DailyAnalyticsSchema.index({ vehicleId: 1, date: -1 });
DailyAnalyticsSchema.index({ date: -1 });

export const DailyAnalytics = mongoose.model<IDailyAnalytics>(
  "DailyAnalytics",
  DailyAnalyticsSchema,
  "daily_analytics"
);

