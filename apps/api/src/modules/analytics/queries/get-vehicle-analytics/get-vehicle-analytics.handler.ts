import { injectable } from "../../../../infrastructure/event-source/container";
import { QueryHandler } from "../../../../infrastructure/decorators/query-handler";
import { IQueryHandler } from "../../../../infrastructure/event-source/query-bus";
import { GetVehicleAnalyticsQuery } from "./get-vehicle-analytics.query";
import { DailyAnalytics } from "../../models/analytics";
import { Vehicle } from "../../../vehicle/models/vehicle";
import { NotFoundError } from "../../../../shared/errors/apiError";
import logger from "../../../../infrastructure/configs/logger";

@injectable()
@QueryHandler(GetVehicleAnalyticsQuery)
export class GetVehicleAnalyticsHandler implements IQueryHandler<GetVehicleAnalyticsQuery> {
  async execute(query: GetVehicleAnalyticsQuery): Promise<any> {
    logger.info(`Fetching analytics for vehicle: ${query.vehicleId}`);

    // Verify vehicle exists
    const vehicle = await Vehicle.findById(query.vehicleId).lean();
    if (!vehicle) {
      throw new NotFoundError(`Vehicle not found: ${query.vehicleId}`);
    }

    const filter: any = {
      vehicleId: query.vehicleId,
    };

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

    // Fetch daily analytics
    const dailyData = await DailyAnalytics.find(filter).sort({ date: -1 }).lean();

    // Calculate aggregate statistics
    const totalDays = dailyData.length;

    if (totalDays === 0) {
      return {
        vehicleId: query.vehicleId,
        vehicle: {
          vin: vehicle.vin,
          licensePlate: vehicle.licensePlate,
          vehicleModel: vehicle.vehicleModel,
          manufacturer: vehicle.manufacturer,
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
        dailyData: [],
      };
    }

    const summary = dailyData.reduce(
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
        sumFuelEfficiency: acc.sumFuelEfficiency + day.fuelEfficiency,
        sumEngineTemp: acc.sumEngineTemp + day.averageEngineTemp,
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
        sumFuelEfficiency: 0,
        sumEngineTemp: 0,
      }
    );

    logger.info(`Found ${totalDays} days of analytics for vehicle ${query.vehicleId}`);

    return {
      vehicleId: query.vehicleId,
      vehicle: {
        vin: vehicle.vin,
        licensePlate: vehicle.licensePlate,
        vehicleModel: vehicle.vehicleModel,
        manufacturer: vehicle.manufacturer,
      },
      summary: {
        totalDays,
        totalDistanceTraveled: summary.totalDistanceTraveled,
        totalHoursOperated: summary.totalHoursOperated,
        totalHoursIdle: summary.totalHoursIdle,
        totalFuelConsumed: summary.totalFuelConsumed,
        totalTrips: summary.totalTrips,
        averageSpeed: summary.sumSpeed / totalDays,
        maxSpeed: summary.maxSpeed,
        averageFuelEfficiency:
          summary.totalFuelConsumed > 0 ? summary.totalDistanceTraveled / summary.totalFuelConsumed : 0,
        averageEngineTemp: summary.sumEngineTemp / totalDays,
        maxEngineTemp: summary.maxEngineTemp,
        overallDataQuality:
          summary.totalDataPoints > 0 ? (summary.totalValidDataPoints / summary.totalDataPoints) * 100 : 0,
        totalDataPoints: summary.totalDataPoints,
      },
      dailyData,
    };
  }
}
