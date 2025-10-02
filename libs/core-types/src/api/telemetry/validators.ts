import { z } from 'zod';
import { ValidationSeverity } from '../../enums';

const GeoJSONPointSchema = z.object({
  type: z.literal('Point'),
  coordinates: z
    .tuple([
      z.number().min(-180).max(180), // longitude
      z.number().min(-90).max(90), // latitude
    ])
    .describe('Coordinates as [longitude, latitude]'),
});

export const SaveTelemetryRequestSchema = z.object({
  vehicleId: z.string().min(1, 'Vehicle ID is required'),
  location: z.object({
    lat: z
      .number()
      .min(-90, 'Latitude must be between -90 and 90')
      .max(90, 'Latitude must be between -90 and 90'),
    lng: z
      .number()
      .min(-180, 'Longitude must be between -180 and 180')
      .max(180, 'Longitude must be between -180 and 180'),
  }),
  speed: z.number().min(0, 'Speed cannot be negative').max(300, 'Speed exceeds maximum limit'),
  fuelLevel: z
    .number()
    .min(0, 'Fuel level cannot be negative')
    .max(100, 'Fuel level cannot exceed 100%'),
  odometer: z.number().min(0, 'Odometer cannot be negative'),
  engineTemp: z
    .number()
    .min(-50, 'Engine temperature too low')
    .max(200, 'Engine temperature too high'),
  engineRPM: z
    .number()
    .min(0, 'RPM cannot be negative')
    .max(10000, 'RPM exceeds maximum')
    .optional(),
  timestamp: z.coerce.date(),
  deviceId: z.string().optional(),
});

export const SaveTelemetryBatchRequestSchema = z.object({
  vehicleId: z.string().min(1, 'Vehicle ID is required'),
  telemetryData: z
    .array(
      z.object({
        location: z.object({
          lat: z.number().min(-90).max(90),
          lng: z.number().min(-180).max(180),
        }),
        speed: z.number().min(0).max(300),
        fuelLevel: z.number().min(0).max(100),
        odometer: z.number().min(0),
        engineTemp: z.number().min(-50).max(200),
        engineRPM: z.number().min(0).max(10000).optional(),
        timestamp: z.coerce.date(),
      }),
    )
    .min(1, 'Batch must contain at least one telemetry record')
    .max(1000, 'Batch size exceeds maximum of 1000 records'),
  deviceId: z.string().optional(),
});

export const GetTelemetryHistoryRequestSchema = z.object({
  vehicleId: z.string().min(1, 'Vehicle ID is required'),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  page: z.number().int().min(1).optional().default(1),
  limit: z.number().int().min(1).max(1000).optional().default(100),
});

export const TelemetryValidationSchema = z.object({
  schemaValid: z.boolean(),
  contextValid: z.boolean(),
  issues: z.array(z.string()).default([]),
  severity: z.nativeEnum(ValidationSeverity).optional(),
});

export type SaveTelemetryRequestValidated = z.infer<typeof SaveTelemetryRequestSchema>;
export type SaveTelemetryBatchRequestValidated = z.infer<typeof SaveTelemetryBatchRequestSchema>;
export type GetTelemetryHistoryRequestValidated = z.infer<typeof GetTelemetryHistoryRequestSchema>;
