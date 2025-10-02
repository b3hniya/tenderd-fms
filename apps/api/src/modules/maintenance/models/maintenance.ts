import mongoose, { Document, Schema } from "mongoose";
import { MaintenanceType, MaintenanceStatus } from "@tenderd-fms/core-types";

export interface IMaintenance extends Document {
  vehicleId: string;

  type: MaintenanceType;
  status: MaintenanceStatus;

  title: string;
  description?: string;

  parts?: {
    name: string;
    quantity: number;
    cost: number;
  }[];
  laborCost?: number;
  totalCost?: number;

  scheduledAt?: Date;
  startedAt?: Date;
  completedAt?: Date;

  mechanicId?: string;
  mechanicName?: string;

  odometerReading?: number;

  notes?: string;

  createdAt: Date;
  updatedAt: Date;
}

const MaintenanceSchema = new Schema<IMaintenance>(
  {
    vehicleId: {
      type: String,
      required: true,
      ref: "Vehicle",
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(MaintenanceType),
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(MaintenanceStatus),
      required: true,
      default: MaintenanceStatus.SCHEDULED,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    parts: [
      {
        name: {
          type: String,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        cost: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],
    laborCost: {
      type: Number,
      min: 0,
    },
    totalCost: {
      type: Number,
      min: 0,
    },
    scheduledAt: Date,
    startedAt: Date,
    completedAt: Date,
    mechanicId: String,
    mechanicName: String,
    odometerReading: {
      type: Number,
      min: 0,
    },
    notes: {
      type: String,
      maxlength: 5000,
    },
  },
  {
    timestamps: true,
    collection: "maintenance",
  }
);

MaintenanceSchema.index({ vehicleId: 1, completedAt: -1 });
MaintenanceSchema.index({ status: 1, scheduledAt: 1 });
MaintenanceSchema.index({ createdAt: -1 });

MaintenanceSchema.virtual("duration").get(function () {
  if (this.startedAt && this.completedAt) {
    return this.completedAt.getTime() - this.startedAt.getTime();
  }
  return null;
});

MaintenanceSchema.pre("save", function (next) {
  if (this.parts && this.parts.length > 0) {
    const partsCost = this.parts.reduce((sum, part) => sum + part.quantity * part.cost, 0);
    this.totalCost = partsCost + (this.laborCost || 0);
  }
  next();
});

export const Maintenance = mongoose.model<IMaintenance>("Maintenance", MaintenanceSchema, "maintenance");
