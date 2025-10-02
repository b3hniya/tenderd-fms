import mongoose, { Document, Schema } from "mongoose";
import { VehicleType, VehicleStatus, FuelType, ConnectionStatus } from "@tenderd-fms/core-types";

export interface IVehicle extends Document {
  vin: string;
  licensePlate: string;

  vehicleModel: string;
  manufacturer: string;
  year: number;
  type: VehicleType;
  fuelType: FuelType;

  status: VehicleStatus;

  currentTelemetry?: {
    location: {
      type: "Point";
      coordinates: [number, number]; // [longitude, latitude]
    };
    speed: number;
    fuelLevel: number;
    odometer: number;
    engineTemp: number;
    timestamp: Date;
  };

  connectionStatus: ConnectionStatus;
  lastSeenAt: Date;
  offlineSince?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const VehicleSchema = new Schema<IVehicle>(
  {
    _id: {
      type: String,
      required: true,
    },
    vin: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      length: 17,
      uppercase: true,
      index: true,
    },
    licensePlate: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },

    vehicleModel: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    manufacturer: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    year: {
      type: Number,
      required: true,
      min: 1900,
      max: new Date().getFullYear() + 1,
    },
    type: {
      type: String,
      enum: Object.values(VehicleType),
      required: true,
    },
    fuelType: {
      type: String,
      enum: Object.values(FuelType),
      required: true,
    },

    status: {
      type: String,
      enum: Object.values(VehicleStatus),
      default: VehicleStatus.ACTIVE,
      index: true,
    },

    currentTelemetry: {
      type: {
        location: {
          type: {
            type: String,
            enum: ["Point"],
            default: "Point",
          },
          coordinates: {
            type: [Number],
            required: function (this: any) {
              return this.currentTelemetry != null;
            },
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
          min: 0,
          max: 300,
        },
        fuelLevel: {
          type: Number,
          min: 0,
          max: 100,
        },
        odometer: {
          type: Number,
          min: 0,
        },
        engineTemp: {
          type: Number,
          min: -50,
          max: 200,
        },
        timestamp: Date,
      },
      required: false,
    },

    connectionStatus: {
      type: String,
      enum: Object.values(ConnectionStatus),
      default: ConnectionStatus.OFFLINE,
    },
    lastSeenAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    offlineSince: {
      type: Date,
    },
  },
  {
    timestamps: true,
    collection: "vehicle",
    _id: false,
  }
);

VehicleSchema.index({ "currentTelemetry.location": "2dsphere" });
VehicleSchema.index({ status: 1, connectionStatus: 1 });
VehicleSchema.index({ type: 1 });
VehicleSchema.index({ lastSeenAt: -1 });

VehicleSchema.virtual("isOnline").get(function (this: IVehicle) {
  return this.connectionStatus === ConnectionStatus.ONLINE;
});

export const Vehicle = mongoose.model<IVehicle>("Vehicle", VehicleSchema, "vehicle");
