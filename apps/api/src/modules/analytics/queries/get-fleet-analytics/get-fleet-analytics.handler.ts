import { injectable } from "../../../../infrastructure/event-source/container";
import { QueryHandler } from "../../../../infrastructure/decorators/query-handler";
import { IQueryHandler } from "../../../../infrastructure/event-source/query-bus";
import { GetFleetAnalyticsQuery } from "./get-fleet-analytics.query";
import { DailyAnalytics } from "../../models/analytics";
import { Vehicle } from "../../../vehicle/models/vehicle";
import logger from "../../../../infrastructure/configs/logger";

@injectable()
@QueryHandler(GetFleetAnalyticsQuery)
export class GetFleetAnalyticsHandler implements IQueryHandler<GetFleetAnalyticsQuery> {
  async execute(query: GetFleetAnalyticsQuery): Promise<any> {
    logger.info("Fetching fleet-wide analytics");

    const filter: any = {};

    // Apply date filtering
    if (query.startDate || query.endDate) {
      filter.date = {};
      if (query.startDate) {
        filter.date.$gte = query.startDate;
      }
      if (query.endDate) {
        filter.date.$lte = query.endDate;
      }
    }

    // Fetch all analytics data
    const allAnalytics = await DailyAnalytics.find(filter).lean();

    // Get vehicle count and connection status
    const totalVehicles = await Vehicle.countDocuments();
    const onlineVehicles = await Vehicle.countDocuments({ connectionStatus: "ONLINE" });
    const offlineVehicles = await Vehicle.countDocuments({ connectionStatus: "OFFLINE" });

    if (allAnalytics.length === 0) {
      return {
        fleet: {
          totalVehicles,
          onlineVehicles,
          offlineVehicles,
          activeVehicles: 0,
        },
        summary: {
          totalDays: 0,
          totalDistanceTraveled: 0,
          totalHoursOperated: 0,
          totalHoursIdle: 0,
          totalFuelConsumed: 0,
          totalTrips: 0,
          averageSpeed: 0,
          maxSpeed: 0,
          averageFuelEfficiency: 0,
          averageEngineTemp: 0,
          maxEngineTemp: 0,
          overallDataQuality: 0,
          totalDataPoints: 0,
        },
        vehicleBreakdown: [],
      };
    }

    // Group by vehicle
    const vehicleMap = new Map<string, any[]>();
    for (const analytics of allAnalytics) {
      if (!vehicleMap.has(analytics.vehicleId)) {
        vehicleMap.set(analytics.vehicleId, []);
      }
      vehicleMap.get(analytics.vehicleId)!.push(analytics);
    }

    const activeVehicles = vehicleMap.size;

    // Calculate fleet-wide aggregates
    const summary = allAnalytics.reduce(
      (acc, day) => ({
        totalDistanceTraveled: acc.totalDistanceTraveled + day.distanceTraveled,
        totalHoursOperated: acc.totalHoursOperated + day.hoursOperated,
        totalHoursIdle: acc.totalHoursIdle + day.hoursIdle,
        totalFuelConsumed: acc.totalFuelConsumed + day.fuelConsumed,
        totalTrips: acc.totalTrips + day.tripCount,
        maxSpeed: Math.max(acc.maxSpeed, day.maxSpeed),
        maxEngineTemp: Math.max(acc.maxEngineTemp, day.maxEngineTemp),
        totalDataPoints: acc.totalDataPoints + day.dataPoints,
        totalValidDataPoints: acc.totalValidDataPoints + day.validDataPoints,
        sumSpeed: acc.sumSpeed + day.averageSpeed,
        sumEngineTemp: acc.sumEngineTemp + day.averageEngineTemp,
        dayCount: acc.dayCount + 1,
      }),
      {
        totalDistanceTraveled: 0,
        totalHoursOperated: 0,
        totalHoursIdle: 0,
        totalFuelConsumed: 0,
        totalTrips: 0,
        maxSpeed: 0,
        maxEngineTemp: 0,
        totalDataPoints: 0,
        totalValidDataPoints: 0,
        sumSpeed: 0,
        sumEngineTemp: 0,
        dayCount: 0,
      }
    );

    // Calculate per-vehicle breakdown
    const vehicleBreakdown = [];
    for (const [vehicleId, dailyData] of vehicleMap.entries()) {
      const vehicleData = dailyData.reduce(
        (acc, day) => ({
          distanceTraveled: acc.distanceTraveled + day.distanceTraveled,
          hoursOperated: acc.hoursOperated + day.hoursOperated,
          fuelConsumed: acc.fuelConsumed + day.fuelConsumed,
          trips: acc.trips + day.tripCount,
          dataPoints: acc.dataPoints + day.dataPoints,
          validDataPoints: acc.validDataPoints + day.validDataPoints,
        }),
        {
          distanceTraveled: 0,
          hoursOperated: 0,
          fuelConsumed: 0,
          trips: 0,
          dataPoints: 0,
          validDataPoints: 0,
        }
      );

      vehicleBreakdown.push({
        vehicleId,
        distanceTraveled: vehicleData.distanceTraveled,
        hoursOperated: vehicleData.hoursOperated,
        fuelConsumed: vehicleData.fuelConsumed,
        trips: vehicleData.trips,
        dataQuality: vehicleData.dataPoints > 0 ? (vehicleData.validDataPoints / vehicleData.dataPoints) * 100 : 0,
      });
    }

    // Sort by distance traveled (most active first)
    vehicleBreakdown.sort((a, b) => b.distanceTraveled - a.distanceTraveled);

    logger.info(`Fetched fleet analytics for ${activeVehicles} vehicles`);

    return {
      fleet: {
        totalVehicles,
        onlineVehicles,
        offlineVehicles,
        activeVehicles,
      },
      summary: {
        totalDays: summary.dayCount,
        totalDistanceTraveled: summary.totalDistanceTraveled,
        totalHoursOperated: summary.totalHoursOperated,
        totalHoursIdle: summary.totalHoursIdle,
        totalFuelConsumed: summary.totalFuelConsumed,
        totalTrips: summary.totalTrips,
        averageSpeed: summary.dayCount > 0 ? summary.sumSpeed / summary.dayCount : 0,
        maxSpeed: summary.maxSpeed,
        averageFuelEfficiency:
          summary.totalFuelConsumed > 0 ? summary.totalDistanceTraveled / summary.totalFuelConsumed : 0,
        averageEngineTemp: summary.dayCount > 0 ? summary.sumEngineTemp / summary.dayCount : 0,
        maxEngineTemp: summary.maxEngineTemp,
        overallDataQuality:
          summary.totalDataPoints > 0 ? (summary.totalValidDataPoints / summary.totalDataPoints) * 100 : 0,
        totalDataPoints: summary.totalDataPoints,
      },
      vehicleBreakdown,
    };
  }
}
