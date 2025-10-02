/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */

import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AnalyticsService {
  /**
   * Get fleet-wide analytics
   * @param startDate Start date for analytics range
   * @param endDate End date for analytics range
   * @returns any Fleet analytics retrieved successfully
   * @throws ApiError
   */
  public static getApiAnalyticsFleet(
    startDate?: string,
    endDate?: string,
  ): CancelablePromise<{
    success?: boolean;
    data?: {
      fleet?: {
        totalVehicles?: number;
        onlineVehicles?: number;
        offlineVehicles?: number;
        activeVehicles?: number;
      };
      summary?: {
        totalDays?: number;
        totalDistanceTraveled?: number;
        totalHoursOperated?: number;
        totalHoursIdle?: number;
        totalFuelConsumed?: number;
        totalTrips?: number;
        averageSpeed?: number;
        maxSpeed?: number;
        averageFuelEfficiency?: number;
        averageEngineTemp?: number;
        maxEngineTemp?: number;
        overallDataQuality?: number;
        totalDataPoints?: number;
      };
      vehicleBreakdown?: Array<{
        vehicleId?: string;
        distanceTraveled?: number;
        hoursOperated?: number;
        fuelConsumed?: number;
        trips?: number;
        dataQuality?: number;
      }>;
    };
  }> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/api/analytics/fleet',
      query: {
        startDate: startDate,
        endDate: endDate,
      },
      errors: {
        400: `Invalid request parameters`,
      },
    });
  }
  /**
   * Get analytics for a specific vehicle
   * @param vehicleId Vehicle ID
   * @param startDate Start date for analytics range
   * @param endDate End date for analytics range
   * @returns any Vehicle analytics retrieved successfully
   * @throws ApiError
   */
  public static getApiAnalyticsVehicle(
    vehicleId: string,
    startDate?: string,
    endDate?: string,
  ): CancelablePromise<{
    success?: boolean;
    data?: {
      vehicleId?: string;
      vehicle?: {
        vin?: string;
        licensePlate?: string;
        vehicleModel?: string;
        manufacturer?: string;
      };
      summary?: {
        totalDays?: number;
        totalDistanceTraveled?: number;
        totalHoursOperated?: number;
        totalHoursIdle?: number;
        totalFuelConsumed?: number;
        totalTrips?: number;
        averageSpeed?: number;
        maxSpeed?: number;
        averageFuelEfficiency?: number;
        averageEngineTemp?: number;
        maxEngineTemp?: number;
        overallDataQuality?: number;
        totalDataPoints?: number;
      };
      dailyData?: Array<Record<string, any>>;
    };
  }> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/api/analytics/vehicle',
      query: {
        vehicleId: vehicleId,
        startDate: startDate,
        endDate: endDate,
      },
      errors: {
        400: `Invalid request parameters`,
        404: `Vehicle not found`,
      },
    });
  }
}
