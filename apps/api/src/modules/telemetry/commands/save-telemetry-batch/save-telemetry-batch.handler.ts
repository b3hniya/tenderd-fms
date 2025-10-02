import { injectable, inject } from "../../../../infrastructure/event-source/container";
import { CommandHandler } from "../../../../infrastructure/decorators/command-handler";
import { ICommandHandler } from "../../../../infrastructure/event-source/command-bus";
import { EventBus } from "../../../../infrastructure/event-source/event-bus";
import { SaveTelemetryBatchCommand } from "./save-telemetry-batch.command";
import { Telemetry } from "../../models/telemetry";
import { Vehicle } from "../../../vehicle/models/vehicle";
import { NotFoundError } from "../../../../shared/errors/apiError";
import { validateTelemetryContext } from "../../services/telemetry-validator";
import { TelemetryReceivedEvent } from "../../../../shared/events/telemetry-received-event";
import logger from "../../../../infrastructure/configs/logger";

@injectable()
@CommandHandler(SaveTelemetryBatchCommand)
export class SaveTelemetryBatchHandler implements ICommandHandler<SaveTelemetryBatchCommand> {
  constructor(@inject(EventBus) private eventBus: EventBus) {}

  async execute(command: SaveTelemetryBatchCommand): Promise<any> {
    logger.info(`Saving batch of ${command.telemetryData.length} telemetry records for vehicle: ${command.vehicleId}`);

    const vehicle = await Vehicle.findById(command.vehicleId);
    if (!vehicle) {
      throw new NotFoundError(`Vehicle not found: ${command.vehicleId}`);
    }

    const sortedData = [...command.telemetryData].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    let lastTelemetry = await Telemetry.findOne({ vehicleId: command.vehicleId }).sort({ timestamp: -1 }).lean();

    const telemetryRecords = [];
    const validationResults = {
      total: sortedData.length,
      valid: 0,
      invalid: 0,
      issues: [] as any[],
    };

    for (const data of sortedData) {
      const validation = validateTelemetryContext(
        {
          location: data.location,
          speed: data.speed,
          fuelLevel: data.fuelLevel,
          odometer: data.odometer,
          engineTemp: data.engineTemp,
          timestamp: data.timestamp,
        },
        lastTelemetry
      );

      if (!validation.contextValid) {
        validationResults.invalid++;
        validationResults.issues.push({
          timestamp: data.timestamp,
          issues: validation.issues,
          severity: validation.severity,
        });
      } else {
        validationResults.valid++;
      }

      const telemetryRecord = {
        vehicleId: command.vehicleId,
        location: {
          type: "Point" as const,
          coordinates: [data.location.lng, data.location.lat] as [number, number],
        },
        speed: data.speed,
        fuelLevel: data.fuelLevel,
        odometer: data.odometer,
        engineTemp: data.engineTemp,
        engineRPM: data.engineRPM,
        timestamp: data.timestamp,
        validation,
        deviceId: command.deviceId,
        receivedAt: new Date(),
      };

      telemetryRecords.push(telemetryRecord);

      lastTelemetry = telemetryRecord as any;
    }

    const savedRecords = await Telemetry.insertMany(telemetryRecords);

    const latestData = sortedData[sortedData.length - 1];
    await Vehicle.findByIdAndUpdate(command.vehicleId, {
      $set: {
        "currentTelemetry.location": {
          type: "Point",
          coordinates: [latestData.location.lng, latestData.location.lat],
        },
        "currentTelemetry.speed": latestData.speed,
        "currentTelemetry.fuelLevel": latestData.fuelLevel,
        "currentTelemetry.odometer": latestData.odometer,
        "currentTelemetry.engineTemp": latestData.engineTemp,
        "currentTelemetry.timestamp": latestData.timestamp,
        connectionStatus: "ONLINE",
        lastSeenAt: new Date(),
      },
      $unset: {
        offlineSince: "",
      },
    });

    logger.info(
      `Batch saved for vehicle ${command.vehicleId}. Valid: ${validationResults.valid}, Invalid: ${validationResults.invalid}`
    );

    await this.eventBus.publish(
      new TelemetryReceivedEvent(command.vehicleId, {
        location: latestData.location,
        speed: latestData.speed,
        fuelLevel: latestData.fuelLevel,
        odometer: latestData.odometer,
        engineTemp: latestData.engineTemp,
        engineRPM: latestData.engineRPM,
        timestamp: latestData.timestamp,
        validation: telemetryRecords[telemetryRecords.length - 1].validation,
      })
    );

    return {
      saved: savedRecords.length,
      validation: validationResults,
    };
  }
}
