import { injectable } from "../../../../infrastructure/event-source/container";
import { Validator, IValidator, ValidationResult, ZodAdapter } from "../../../../infrastructure/validation";
import { z } from "zod";
import { GetVehicleAnalyticsQuery } from "./get-vehicle-analytics.query";

const GetVehicleAnalyticsRequestSchema = z.object({
  vehicleId: z.string().min(1, "Vehicle ID is required"),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
});

@injectable()
@Validator(GetVehicleAnalyticsQuery)
export class GetVehicleAnalyticsValidator implements IValidator<GetVehicleAnalyticsQuery> {
  validate(query: GetVehicleAnalyticsQuery): ValidationResult {
    return ZodAdapter.validate(GetVehicleAnalyticsRequestSchema, {
      vehicleId: query.vehicleId,
      startDate: query.startDate,
      endDate: query.endDate,
    });
  }
}
