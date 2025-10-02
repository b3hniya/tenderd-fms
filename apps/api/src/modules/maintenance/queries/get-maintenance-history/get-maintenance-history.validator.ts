import { injectable } from "../../../../infrastructure/event-source/container";
import { Validator, IValidator, ValidationResult, ZodAdapter } from "../../../../infrastructure/validation";
import { GetMaintenanceHistoryRequestSchema } from "@tenderd-fms/core-types";
import { GetMaintenanceHistoryQuery } from "./get-maintenance-history.query";

@injectable()
@Validator(GetMaintenanceHistoryQuery)
export class GetMaintenanceHistoryValidator implements IValidator<GetMaintenanceHistoryQuery> {
  validate(query: GetMaintenanceHistoryQuery): ValidationResult {
    return ZodAdapter.validate(GetMaintenanceHistoryRequestSchema, {
      vehicleId: query.vehicleId,
      status: query.status,
      startDate: query.startDate,
      endDate: query.endDate,
      page: query.page,
      limit: query.limit,
    });
  }
}
