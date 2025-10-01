import mongoose, { Document, Schema } from "mongoose";

export interface ITelemetry extends Document {
  // Meta (groups time-series data by vehicle)
  vehicleId: string;

  // Time field (required for time-series)
  timestamp: Date;

  // Location Data (GeoJSON format)
  location: {
    type: "Point";
    coordinates: [number, number]; // [longitude, latitude]
  };

  speed: number;
  fuelLevel: number;
  odometer: number;
  engineTemp: number;
  engineRPM?: number;

  validation: {
    schemaValid: boolean;
    contextValid: boolean;
    issues: string[];
    severity?: "LOW" | "MEDIUM" | "HIGH";
  };

  deviceId?: string;
  receivedAt: Date;
}

/**
 * Create time-series collection for telemetry data
 * This must be called during database initialization
 */
export async function createTelemetryCollection(db: any) {
  try {
    await db.createCollection("telemetry", {
      timeseries: {
        timeField: "timestamp",
        metaField: "vehicleId",
        granularity: "seconds",
      },
      expireAfterSeconds: 7776000, // 90 days TTL (auto-delete old data)
    });

    console.log("✅ Time-series collection 'telemetry' created");
  } catch (error: any) {
    if (error.code === 48) {
      console.log("ℹ️  Time-series collection 'telemetry' already exists");
    } else {
      throw error;
    }
  }
}

const TelemetrySchema = new Schema<ITelemetry>(
  {
    vehicleId: {
      type: String,
      required: true,
      index: true,
    },
    timestamp: {
      type: Date,
      required: true,
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        required: true,
        validate: {
          validator: function (coords: number[]) {
            return (
              coords.length === 2 &&
              coords[0] >= -180 &&
              coords[0] <= 180 && // longitude
              coords[1] >= -90 &&
              coords[1] <= 90
            ); // latitude
          },
          message: "Invalid coordinates",
        },
      },
    },
    speed: {
      type: Number,
      required: true,
      min: 0,
      max: 300,
    },
    fuelLevel: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    odometer: {
      type: Number,
      required: true,
      min: 0,
    },
    engineTemp: {
      type: Number,
      required: true,
      min: -50,
      max: 200,
    },
    engineRPM: {
      type: Number,
      min: 0,
      max: 10000,
    },
    validation: {
      schemaValid: {
        type: Boolean,
        default: true,
      },
      contextValid: {
        type: Boolean,
        default: true,
      },
      issues: {
        type: [String],
        default: [],
      },
      severity: {
        type: String,
        enum: ["LOW", "MEDIUM", "HIGH"],
      },
    },
    deviceId: String,
    receivedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timeseries: {
      timeField: "timestamp",
      metaField: "vehicleId",
      granularity: "seconds",
    },
    collection: "telemetry",
  }
);

TelemetrySchema.index({ vehicleId: 1, timestamp: -1 });
TelemetrySchema.index({ "validation.contextValid": 1 });
TelemetrySchema.index({ location: "2dsphere" });

export const Telemetry = mongoose.model<ITelemetry>(
  "Telemetry",
  TelemetrySchema,
  "telemetry"
);

