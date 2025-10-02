import { injectable, inject } from "../../../../infrastructure/event-source/container";
import { CommandHandler } from "../../../../infrastructure/decorators/command-handler";
import { ICommandHandler } from "../../../../infrastructure/event-source/command-bus";
import { EventBus } from "../../../../infrastructure/event-source/event-bus";
import { SaveTelemetryCommand } from "./save-telemetry.command";
import { Telemetry } from "../../models/telemetry";
import { Vehicle } from "../../../vehicle/models/vehicle";
import { NotFoundError } from "../../../../shared/errors/apiError";
import { validateTelemetryContext } from "../../services/telemetry-validator";
import { TelemetryReceivedEvent } from "../../../../shared/events/telemetry-received-event";
import logger from "../../../../infrastructure/configs/logger";

@injectable()
@CommandHandler(SaveTelemetryCommand)
export class SaveTelemetryHandler implements ICommandHandler<SaveTelemetryCommand> {
  constructor(@inject(EventBus) private eventBus: EventBus) {}

  async execute(command: SaveTelemetryCommand): Promise<any> {
    logger.info(`Saving telemetry for vehicle: ${command.vehicleId}`);

    const vehicle = await Vehicle.findById(command.vehicleId);
    if (!vehicle) {
      throw new NotFoundError(`Vehicle not found: ${command.vehicleId}`);
    }

    const lastTelemetry = await Telemetry.findOne({ vehicleId: command.vehicleId }).sort({ timestamp: -1 }).lean();

    const validation = validateTelemetryContext(
      {
        location: command.location,
        speed: command.speed,
        fuelLevel: command.fuelLevel,
        odometer: command.odometer,
        engineTemp: command.engineTemp,
        timestamp: command.timestamp || new Date(),
      },
      lastTelemetry
    );

    const telemetry = await Telemetry.create({
      vehicleId: command.vehicleId,
      location: {
        type: "Point",
        coordinates: [command.location.lng, command.location.lat],
      },
      speed: command.speed,
      fuelLevel: command.fuelLevel,
      odometer: command.odometer,
      engineTemp: command.engineTemp,
      engineRPM: command.engineRPM,
      timestamp: command.timestamp || new Date(),
      validation,
      deviceId: command.deviceId,
      receivedAt: new Date(),
    });

    await Vehicle.findByIdAndUpdate(command.vehicleId, {
      $set: {
        "currentTelemetry.location": {
          type: "Point",
          coordinates: [command.location.lng, command.location.lat],
        },
        "currentTelemetry.speed": command.speed,
        "currentTelemetry.fuelLevel": command.fuelLevel,
        "currentTelemetry.odometer": command.odometer,
        "currentTelemetry.engineTemp": command.engineTemp,
        "currentTelemetry.timestamp": command.timestamp || new Date(),
        connectionStatus: "ONLINE",
        lastSeenAt: new Date(),
      },
      $unset: {
        offlineSince: "",
      },
    });

    logger.info(`Telemetry saved for vehicle ${command.vehicleId}. Valid: ${validation.contextValid}`);

    await this.eventBus.publish(
      new TelemetryReceivedEvent(command.vehicleId, {
        location: command.location,
        speed: command.speed,
        fuelLevel: command.fuelLevel,
        odometer: command.odometer,
        engineTemp: command.engineTemp,
        engineRPM: command.engineRPM,
        timestamp: command.timestamp || new Date(),
        validation: {
          schemaValid: validation.schemaValid,
          contextValid: validation.contextValid,
          issues: validation.issues,
          severity: validation.severity,
        },
      })
    );

    return telemetry;
  }
}
