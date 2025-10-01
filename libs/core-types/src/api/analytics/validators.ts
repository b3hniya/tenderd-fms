import { z } from 'zod';

export const GetVehicleAnalyticsRequestSchema = z
  .object({
    vehicleId: z.string().min(1, 'Vehicle ID is required'),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
  })
  .refine(data => data.endDate >= data.startDate, {
    message: 'End date must be after or equal to start date',
    path: ['endDate'],
  });

export const GetFleetAnalyticsRequestSchema = z
  .object({
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
  })
  .refine(data => data.endDate >= data.startDate, {
    message: 'End date must be after or equal to start date',
    path: ['endDate'],
  });

export const GetDailyAnalyticsRequestSchema = z.object({
  vehicleId: z.string().min(1, 'Vehicle ID is required'),
  date: z.coerce.date(),
});

export type GetVehicleAnalyticsRequestValidated = z.infer<typeof GetVehicleAnalyticsRequestSchema>;
export type GetFleetAnalyticsRequestValidated = z.infer<typeof GetFleetAnalyticsRequestSchema>;
export type GetDailyAnalyticsRequestValidated = z.infer<typeof GetDailyAnalyticsRequestSchema>;
