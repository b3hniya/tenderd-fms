import { DailyAnalytics } from '../../entity';

export interface GetVehicleAnalyticsResponse {
  vehicleId: string;
  analytics: DailyAnalytics[];
  summary: {
    totalDistance: number;
    totalHoursOperated: number;
    averageSpeed: number;
    totalFuelConsumed: number;
    averageFuelEfficiency: number;
  };
}

export interface GetFleetAnalyticsResponse {
  totalVehicles: number;
  analytics: {
    vehicleId: string;
    summary: {
      totalDistance: number;
      totalHoursOperated: number;
      averageSpeed: number;
    };
  }[];
  fleetSummary: {
    totalDistance: number;
    totalHoursOperated: number;
    averageSpeed: number;
  };
}

export interface GetDailyAnalyticsResponse extends DailyAnalytics {}
