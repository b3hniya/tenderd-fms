import { z } from 'zod';
import { MaintenanceType, MaintenanceStatus } from '../../enums';

export const MaintenancePartSchema = z.object({
  name: z.string().min(1, 'Part name is required'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  cost: z.number().min(0, 'Cost cannot be negative'),
});

export const CreateMaintenanceRequestSchema = z.object({
  vehicleId: z.string().min(1, 'Vehicle ID is required'),
  type: z.nativeEnum(MaintenanceType, {
    errorMap: () => ({ message: 'Invalid maintenance type' }),
  }),
  title: z.string().min(1, 'Title is required').max(200, 'Title too long').trim(),
  description: z.string().max(2000, 'Description too long').trim().optional(),
  scheduledAt: z.coerce.date().optional(),
  mechanicId: z.string().optional(),
  mechanicName: z.string().optional(),
  odometerReading: z.number().min(0, 'Odometer reading cannot be negative').optional(),
  notes: z.string().max(5000, 'Notes too long').optional(),
});

export const UpdateMaintenanceRequestSchema = z.object({
  status: z
    .nativeEnum(MaintenanceStatus, {
      errorMap: () => ({ message: 'Invalid maintenance status' }),
    })
    .optional(),
  parts: z.array(MaintenancePartSchema).optional(),
  laborCost: z.number().min(0, 'Labor cost cannot be negative').optional(),
  startedAt: z.coerce.date().optional(),
  completedAt: z.coerce.date().optional(),
  mechanicId: z.string().optional(),
  mechanicName: z.string().optional(),
  notes: z.string().max(5000, 'Notes too long').optional(),
});

export const GetMaintenanceHistoryRequestSchema = z.object({
  vehicleId: z.string().min(1, 'Vehicle ID is required'),
  status: z.nativeEnum(MaintenanceStatus).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  page: z.number().int().min(1).optional().default(1),
  limit: z.number().int().min(1).max(100).optional().default(10),
});

export type CreateMaintenanceRequestValidated = z.infer<typeof CreateMaintenanceRequestSchema>;
export type UpdateMaintenanceRequestValidated = z.infer<typeof UpdateMaintenanceRequestSchema>;
export type GetMaintenanceHistoryRequestValidated = z.infer<
  typeof GetMaintenanceHistoryRequestSchema
>;
export type MaintenancePartValidated = z.infer<typeof MaintenancePartSchema>;
