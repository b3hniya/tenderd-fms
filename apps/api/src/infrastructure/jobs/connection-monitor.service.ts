import { BaseJob } from "./base-job";
import { Vehicle } from "../../modules/vehicle/models/vehicle";
import { EventBus } from "../event-source/event-bus";
import { Container } from "../event-source/container";
import { VehicleOfflineEvent } from "../../events/vehicle-offline-event";
import { VehicleReconnectedEvent } from "../../events/vehicle-reconnected-event";
import { ConnectionStatus } from "@tenderd-fms/core-types";
import logger from "../configs/logger";

/**
 * Background job that monitors vehicle connections
 *
 * Connection States:
 * - ONLINE: lastSeenAt within last 60 seconds
 * - STALE: lastSeenAt between 60s and 5 minutes
 * - OFFLINE: lastSeenAt more than 5 minutes ago
 *
 * Runs every 30 seconds
 */
export class ConnectionMonitorService extends BaseJob {
  private readonly STALE_THRESHOLD_MS = 60 * 1000;
  private readonly OFFLINE_THRESHOLD_MS = 5 * 60 * 1000;
  private eventBus: EventBus;

  constructor() {
    super({
      name: "ConnectionMonitor",
      cronExpression: "*/30 * * * * *",
      enabled: true,
    });

    this.eventBus = Container.resolve(EventBus);
  }

  async execute(): Promise<void> {
    await this.checkStaleConnections();
  }

  /**
   * Check all vehicles for stale/offline connections
   * Updates connection statuses and emits events
   */
  async checkStaleConnections(): Promise<void> {
    try {
      const now = new Date();

      const vehicles = await Vehicle.find({
        lastSeenAt: { $exists: true, $ne: null },
      }).lean();

      logger.debug(`Checking ${vehicles.length} vehicle connection(s)`);

      let onlineCount = 0;
      let staleCount = 0;
      let offlineCount = 0;
      let reconnectedCount = 0;

      for (const vehicle of vehicles) {
        if (!vehicle.lastSeenAt) continue;

        const timeSinceLastSeen = now.getTime() - new Date(vehicle.lastSeenAt).getTime();
        const currentStatus = vehicle.connectionStatus;
        let newStatus = currentStatus;

        if (timeSinceLastSeen < this.STALE_THRESHOLD_MS) {
          newStatus = ConnectionStatus.ONLINE;
          onlineCount++;
        } else if (timeSinceLastSeen < this.OFFLINE_THRESHOLD_MS) {
          newStatus = ConnectionStatus.STALE;
          staleCount++;
        } else {
          newStatus = ConnectionStatus.OFFLINE;
          offlineCount++;
        }

        if (newStatus !== currentStatus) {
          await Vehicle.findByIdAndUpdate(vehicle._id, {
            connectionStatus: newStatus,
          });

          logger.info(
            `Vehicle ${vehicle.vin} connection status changed: ${currentStatus} → ${newStatus} (last seen ${Math.round(timeSinceLastSeen / 1000)}s ago)`
          );

          // Broadcast status change via WebSocket
          const io = (global as any).io;
          if (io) {
            io.emit("vehicle:status-change", {
              vehicleId: vehicle._id.toString(),
              vin: vehicle.vin,
              oldStatus: currentStatus,
              newStatus: newStatus,
              timestamp: now.toISOString(),
            });
          }

          if (newStatus === ConnectionStatus.OFFLINE && currentStatus !== ConnectionStatus.OFFLINE) {
            await this.eventBus.publish(
              new VehicleOfflineEvent(vehicle._id.toString(), vehicle.vin, new Date(vehicle.lastSeenAt), currentStatus)
            );
          } else if (newStatus === ConnectionStatus.ONLINE && currentStatus === ConnectionStatus.OFFLINE) {
            reconnectedCount++;
            await this.eventBus.publish(
              new VehicleReconnectedEvent(vehicle._id.toString(), vehicle.vin, now, timeSinceLastSeen)
            );
          }
        }
      }

      if (onlineCount > 0 || staleCount > 0 || offlineCount > 0) {
        logger.debug(
          `Connection status: ${onlineCount} online, ${staleCount} stale, ${offlineCount} offline` +
            (reconnectedCount > 0 ? `, ${reconnectedCount} reconnected` : "")
        );
      }
    } catch (error) {
      logger.error("Error in connection monitor:", error);
      throw error;
    }
  }
}
