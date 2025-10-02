import { injectable } from "../../../../infrastructure/event-source/container";
import { Validator, IValidator, ValidationResult, ZodAdapter } from "../../../../infrastructure/validation";
import { SaveTelemetryBatchRequestSchema } from "@tenderd-fms/core-types";
import { SaveTelemetryBatchCommand } from "./save-telemetry-batch.command";

@injectable()
@Validator(SaveTelemetryBatchCommand)
export class SaveTelemetryBatchValidator implements IValidator<SaveTelemetryBatchCommand> {
  validate(command: SaveTelemetryBatchCommand): ValidationResult {
    return ZodAdapter.validate(SaveTelemetryBatchRequestSchema, {
      vehicleId: command.vehicleId,
      telemetryData: command.telemetryData,
      deviceId: command.deviceId,
    });
  }
}
