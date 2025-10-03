import { injectable } from "../../../../infrastructure/event-source/container";
import { EventHandler } from "../../../../infrastructure/decorators/event-handler";
import { IEventHandler } from "../../../../infrastructure/event-source/event-bus";
import { VehicleReconnectedEvent } from "../../../../events/vehicle-reconnected-event";
import logger from "../../../../infrastructure/configs/logger";

/**
 * Handles VehicleReconnectedEvent
 *
 * Actions:
 * - Log the reconnection
 * - Clear any pending alerts
 * - Update dashboard status
 * - Track downtime for analytics
 */
@injectable()
@EventHandler(VehicleReconnectedEvent)
export class OnVehicleReconnectedHandler implements IEventHandler<VehicleReconnectedEvent> {
  async handle(event: VehicleReconnectedEvent): Promise<void> {
    const downtimeMinutes = Math.round(event.offlineDuration / 1000 / 60);

    logger.info(
      `🟢 Vehicle RECONNECTED - VIN: ${event.vin}, ` +
        `Downtime: ${downtimeMinutes} minute(s), ` +
        `Reconnected at: ${event.reconnectedAt.toISOString()}`
    );

    // TODO: Clear alerts for this vehicle
    // TODO: Update WebSocket clients
    // TODO: Log downtime to analytics
    // TODO: Send reconnection notification

    // For now, just log the event
    // In production, you would:
    // 1. Clear/resolve any offline alerts
    // 2. Notify fleet managers of reconnection
    // 3. Update real-time dashboard
    // 4. Log downtime duration for SLA tracking
    // 5. Check for any missed telemetry data
  }
}
