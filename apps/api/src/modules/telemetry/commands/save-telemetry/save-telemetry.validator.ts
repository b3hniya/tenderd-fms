import { injectable } from "../../../../infrastructure/event-source/container";
import { Validator, IValidator, ValidationResult, ZodAdapter } from "../../../../infrastructure/validation";
import { SaveTelemetryRequestSchema } from "@tenderd-fms/core-types";
import { SaveTelemetryCommand } from "./save-telemetry.command";

@injectable()
@Validator(SaveTelemetryCommand)
export class SaveTelemetryValidator implements IValidator<SaveTelemetryCommand> {
  validate(command: SaveTelemetryCommand): ValidationResult {
    return ZodAdapter.validate(SaveTelemetryRequestSchema, {
      vehicleId: command.vehicleId,
      location: command.location,
      speed: command.speed,
      fuelLevel: command.fuelLevel,
      odometer: command.odometer,
      engineTemp: command.engineTemp,
      engineRPM: command.engineRPM,
      timestamp: command.timestamp,
      deviceId: command.deviceId,
    });
  }
}
