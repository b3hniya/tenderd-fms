export interface DailyAnalytics {
  vehicleId: string;
  date: Date;

  distanceTraveled: number; // km

  hoursOperated: number; // hours (engine running)
  hoursIdle: number; // hours (engine on, speed = 0)

  averageSpeed: number; // km/h
  maxSpeed: number; // km/h

  fuelConsumed: number; // liters
  fuelEfficiency: number; // km per liter

  averageEngineTemp: number; // celsius
  maxEngineTemp: number; // celsius

  tripCount: number; // Number of trips (engine on → off)

  dataPoints: number; // Number of telemetry records
  validDataPoints: number; // Number with contextValid=true
  dataQuality: number; // Percentage (validDataPoints / dataPoints)

  calculatedAt: Date;
  recalculatedCount: number; // How many times recalculated (for late data)
}
