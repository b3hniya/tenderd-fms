import { injectable } from "../../../../infrastructure/event-source/container";
import { EventHandler } from "../../../../infrastructure/decorators/event-handler";
import { IEventHandler } from "../../../../infrastructure/event-source/event-bus";
import { TelemetryReceivedEvent } from "../../../../shared/events/telemetry-received-event";
import { DailyAnalytics } from "../../models/analytics";
import logger from "../../../../infrastructure/configs/logger";

@injectable()
@EventHandler(TelemetryReceivedEvent)
export class UpdateAnalyticsOnTelemetryHandler implements IEventHandler<TelemetryReceivedEvent> {
  async handle(event: TelemetryReceivedEvent): Promise<void> {
    logger.info(`Updating analytics for vehicle: ${event.vehicleId}`);

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let analytics = await DailyAnalytics.findOne({
        vehicleId: event.vehicleId,
        date: today,
      });

      if (!analytics) {
        analytics = new DailyAnalytics({
          vehicleId: event.vehicleId,
          date: today,
          distanceTraveled: 0,
          hoursOperated: 0,
          hoursIdle: 0,
          averageSpeed: 0,
          maxSpeed: 0,
          fuelConsumed: 0,
          fuelEfficiency: 0,
          averageEngineTemp: 0,
          maxEngineTemp: 0,
          tripCount: 0,
          dataPoints: 0,
          validDataPoints: 0,
          dataQuality: 100,
          calculatedAt: new Date(),
          recalculatedCount: 0,
        });
      }

      analytics.dataPoints += 1;

      if (event.telemetryData.validation.contextValid) {
        analytics.validDataPoints += 1;
      }

      analytics.dataQuality = (analytics.validDataPoints / analytics.dataPoints) * 100;

      if (event.telemetryData.speed > analytics.maxSpeed) {
        analytics.maxSpeed = event.telemetryData.speed;
      }

      const oldAvgSpeed = analytics.averageSpeed;
      const count = analytics.dataPoints;
      analytics.averageSpeed = oldAvgSpeed + (event.telemetryData.speed - oldAvgSpeed) / count;

      if (event.telemetryData.engineTemp > analytics.maxEngineTemp) {
        analytics.maxEngineTemp = event.telemetryData.engineTemp;
      }

      const oldAvgTemp = analytics.averageEngineTemp;
      analytics.averageEngineTemp = oldAvgTemp + (event.telemetryData.engineTemp - oldAvgTemp) / count;

      // TODO: Distance, fuel consumption, and hours operated require time-based calculations
      // TODO: These will be calculated more accurately in a batch job that processes historical data
      // TODO: For now, we just track the basic metrics (counts, speeds, temps)

      analytics.calculatedAt = new Date();

      await analytics.save();

      logger.info(
        `Analytics updated for vehicle ${event.vehicleId} - Data points: ${analytics.dataPoints}, Quality: ${analytics.dataQuality.toFixed(2)}%`
      );
    } catch (error) {
      logger.error(`Error updating analytics for vehicle ${event.vehicleId}:`, error);
    }
  }
}
