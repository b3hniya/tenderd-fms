export interface GetVehicleAnalyticsRequest {
  vehicleId: string;
  startDate: Date;
  endDate: Date;
}

export interface GetFleetAnalyticsRequest {
  startDate: Date;
  endDate: Date;
}

export interface GetDailyAnalyticsRequest {
  vehicleId: string;
  date: Date;
}
