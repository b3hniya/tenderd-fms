import { z } from 'zod';
import { VehicleType, VehicleStatus, FuelType } from '../../enums';

export const CreateVehicleRequestSchema = z.object({
  vin: z
    .string()
    .length(17, 'VIN must be exactly 17 characters')
    .regex(/^[A-Z0-9]+$/, 'VIN must contain only uppercase letters and numbers')
    .trim()
    .toUpperCase(),
  licensePlate: z
    .string()
    .min(1, 'License plate is required')
    .max(20, 'License plate too long')
    .trim()
    .toUpperCase(),
  vehicleModel: z
    .string()
    .min(1, 'Vehicle model is required')
    .max(100, 'Vehicle model too long')
    .trim(),
  manufacturer: z
    .string()
    .min(1, 'Manufacturer is required')
    .max(50, 'Manufacturer name too long')
    .trim(),
  year: z
    .number()
    .int('Year must be an integer')
    .min(1900, 'Year must be 1900 or later')
    .max(new Date().getFullYear() + 1, 'Year cannot be more than one year in the future'),
  type: z.nativeEnum(VehicleType, {
    errorMap: () => ({ message: 'Invalid vehicle type' }),
  }),
  fuelType: z.nativeEnum(FuelType, {
    errorMap: () => ({ message: 'Invalid fuel type' }),
  }),
  status: z
    .nativeEnum(VehicleStatus, {
      errorMap: () => ({ message: 'Invalid vehicle status' }),
    })
    .optional()
    .default(VehicleStatus.ACTIVE),
});

export const UpdateVehicleRequestSchema = z.object({
  vehicleModel: z.string().min(1).max(100).trim().optional(),
  manufacturer: z.string().min(1).max(50).trim().optional(),
  year: z
    .number()
    .int()
    .min(1900)
    .max(new Date().getFullYear() + 1)
    .optional(),
  type: z.nativeEnum(VehicleType).optional(),
  fuelType: z.nativeEnum(FuelType).optional(),
  status: z.nativeEnum(VehicleStatus).optional(),
});

export const GetVehicleByIdRequestSchema = z.object({
  vehicleId: z.string().min(1, 'Vehicle ID is required'),
});

export const GetAllVehiclesRequestSchema = z.object({
  page: z.number().int().min(1).optional().default(1),
  limit: z.number().int().min(1).max(100).optional().default(10),
  status: z.nativeEnum(VehicleStatus).optional(),
  type: z.nativeEnum(VehicleType).optional(),
});

export type CreateVehicleRequestValidated = z.infer<typeof CreateVehicleRequestSchema>;
export type UpdateVehicleRequestValidated = z.infer<typeof UpdateVehicleRequestSchema>;
export type GetVehicleByIdRequestValidated = z.infer<typeof GetVehicleByIdRequestSchema>;
export type GetAllVehiclesRequestValidated = z.infer<typeof GetAllVehiclesRequestSchema>;
