import { injectable } from "../../../../infrastructure/event-source/container";
import { EventHandler } from "../../../../infrastructure/decorators/event-handler";
import { IEventHandler } from "../../../../infrastructure/event-source/event-bus";
import { TelemetryReceivedEvent } from "../../../../shared/events/telemetry-received-event";
import logger from "../../../../infrastructure/configs/logger";

@injectable()
@EventHandler(TelemetryReceivedEvent)
export class BroadcastTelemetryHandler implements IEventHandler<TelemetryReceivedEvent> {
  async handle(event: TelemetryReceivedEvent): Promise<void> {
    logger.info(`Broadcasting telemetry for vehicle: ${event.vehicleId}`);

    const io = (global as any).io;

    if (!io) {
      logger.warn("Socket.IO instance not found. Skipping broadcast.");
      return;
    }

    io.emit("telemetry:update", {
      vehicleId: event.vehicleId,
      location: event.telemetryData.location,
      speed: event.telemetryData.speed,
      fuelLevel: event.telemetryData.fuelLevel,
      odometer: event.telemetryData.odometer,
      engineTemp: event.telemetryData.engineTemp,
      engineRPM: event.telemetryData.engineRPM,
      timestamp: event.telemetryData.timestamp,
      validation: event.telemetryData.validation,
    });

    logger.info(`Telemetry broadcasted for vehicle ${event.vehicleId}`);
  }
}
