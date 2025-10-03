import { injectable } from "../../../../infrastructure/event-source/container";
import { EventHandler } from "../../../../infrastructure/decorators/event-handler";
import { IEventHandler } from "../../../../infrastructure/event-source/event-bus";
import { VehicleOfflineEvent } from "../../../../events/vehicle-offline-event";
import logger from "../../../../infrastructure/configs/logger";

/**
 * Handles VehicleOfflineEvent
 *
 * Actions:
 * - Log the offline event
 * - Could send notifications/alerts to operators
 * - Could trigger maintenance checks
 * - Could update dashboard in real-time via WebSocket
 */
@injectable()
@EventHandler(VehicleOfflineEvent)
export class OnVehicleOfflineHandler implements IEventHandler<VehicleOfflineEvent> {
  async handle(event: VehicleOfflineEvent): Promise<void> {
    logger.warn(
      `🔴 Vehicle went OFFLINE - VIN: ${event.vin}, ` +
        `Last seen: ${event.lastSeenAt.toISOString()}, ` +
        `Previous status: ${event.previousStatus}`
    );

    // TODO: Implement notification system (email, SMS, push notification)
    // TODO: Update WebSocket clients
    // TODO: Create alert record in database
    // TODO: Check if vehicle has pending maintenance

    // For now, just log the event
    // In production, you would:
    // 1. Send alert to fleet managers
    // 2. Update real-time dashboard
    // 3. Check for critical vehicles (emergency services, etc.)
    // 4. Log to analytics for uptime tracking
  }
}
