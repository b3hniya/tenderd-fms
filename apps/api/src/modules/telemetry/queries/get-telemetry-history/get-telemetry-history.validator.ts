import { injectable } from "../../../../infrastructure/event-source/container";
import { Validator, IValidator, ValidationResult, ZodAdapter } from "../../../../infrastructure/validation";
import { GetTelemetryHistoryRequestSchema } from "@tenderd-fms/core-types";
import { GetTelemetryHistoryQuery } from "./get-telemetry-history.query";

@injectable()
@Validator(GetTelemetryHistoryQuery)
export class GetTelemetryHistoryValidator implements IValidator<GetTelemetryHistoryQuery> {
  validate(query: GetTelemetryHistoryQuery): ValidationResult {
    return ZodAdapter.validate(GetTelemetryHistoryRequestSchema, {
      vehicleId: query.vehicleId,
      startDate: query.startDate,
      endDate: query.endDate,
      page: query.page,
      limit: query.limit,
    });
  }
}
