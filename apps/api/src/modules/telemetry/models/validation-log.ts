import mongoose, { Document, Schema } from "mongoose";

export interface IValidationLog extends Document {
  vehicleId: string;
  timestamp: Date;

  rawData: any;

  validationErrors: {
    field: string;
    message: string;
    value: any;
  }[];

  rejectionReason: "SCHEMA_INVALID" | "CONTEXT_INVALID" | "DUPLICATE";
  severity: "LOW" | "MEDIUM" | "HIGH";

  createdAt: Date;
}

const ValidationLogSchema = new Schema<IValidationLog>(
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
    rawData: {
      type: Schema.Types.Mixed,
      required: true,
    },
    validationErrors: [
      {
        field: String,
        message: String,
        value: Schema.Types.Mixed,
      },
    ],
    rejectionReason: {
      type: String,
      enum: ["SCHEMA_INVALID", "CONTEXT_INVALID", "DUPLICATE"],
      required: true,
    },
    severity: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH"],
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: "validation_log",
  }
);

ValidationLogSchema.index({ createdAt: -1 });
ValidationLogSchema.index({ vehicleId: 1, severity: 1 });

// TTL Index - Auto-delete logs older than 30 days
ValidationLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });

export const ValidationLog = mongoose.model<IValidationLog>(
  "ValidationLog",
  ValidationLogSchema,
  "validation_log"
);

