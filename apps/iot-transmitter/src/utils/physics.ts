/**
 * Physics and calculation utilities for vehicle simulation
 */

/**
 * Earth's radius in kilometers
 */
const EARTH_RADIUS_KM = 6371;

/**
 * Convert degrees to radians
 */
export function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param lat1 Latitude of first point (degrees)
 * @param lng1 Longitude of first point (degrees)
 * @param lat2 Latitude of second point (degrees)
 * @param lng2 Longitude of second point (degrees)
 * @returns Distance in kilometers
 */
export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_KM * c;
}

/**
 * Calculate fuel consumption based on speed and distance
 * Uses a simplified model: higher speeds = higher consumption
 *
 * @param speed Current speed in km/h
 * @param distance Distance traveled in km
 * @returns Fuel consumed in percentage (0-100)
 */
export function calculateFuelConsumption(speed: number, distance: number): number {
  const baseConsumptionRate = 10; // L/100km
  const speedFactor = 1 + Math.pow((speed - 80) / 100, 2) * 0.5; // Penalty for deviation from optimal speed

  const consumptionRate = baseConsumptionRate * speedFactor;
  const litersConsumed = (consumptionRate * distance) / 100;

  const tankCapacity = 60;
  const percentageConsumed = (litersConsumed / tankCapacity) * 100;

  return Math.max(0, percentageConsumed);
}

/**
 * Calculate engine RPM based on speed
 * Simplified model assuming automatic transmission
 *
 * @param speed Current speed in km/h
 * @returns Engine RPM
 */
export function calculateRPM(speed: number): number {
  const idleRPM = 800;
  const maxRPM = 6000;
  const maxSpeed = 200; // km/h

  if (speed <= 0) {
    return idleRPM;
  }

  const normalizedSpeed = Math.min(speed / maxSpeed, 1);
  const rpmRange = maxRPM - idleRPM;

  const gearShifts = [20, 40, 60, 90];
  let gearFactor = 1;

  for (const shiftSpeed of gearShifts) {
    if (speed > shiftSpeed) {
      gearFactor += 0.15;
    }
  }

  const baseRPM = idleRPM + normalizedSpeed * rpmRange * 0.7;
  const rpm = baseRPM / Math.sqrt(gearFactor);

  return Math.round(Math.min(Math.max(rpm, idleRPM), maxRPM));
}

/**
 * Calculate engine temperature based on speed and time
 * @param currentTemp Current engine temperature (°C)
 * @param speed Current speed (km/h)
 * @param deltaTime Time elapsed in seconds
 * @returns New engine temperature (°C)
 */
export function calculateEngineTemp(currentTemp: number, speed: number, deltaTime: number): number {
  const ambientTemp = 25; // °C
  const optimalTemp = 90; // °C
  const maxTemp = 110; // °C

  const heatingRate = speed > 0 ? 0.5 : -0.2;

  const coolingRate = currentTemp > optimalTemp ? -0.1 : 0;

  const tempChange = (heatingRate + coolingRate) * (deltaTime / 1000);

  const newTemp = currentTemp + tempChange;

  return Math.max(ambientTemp, Math.min(newTemp, maxTemp));
}

/**
 * Interpolate between two numbers
 * @param start Start value
 * @param end End value
 * @param factor Interpolation factor (0-1)
 * @returns Interpolated value
 */
export function lerp(start: number, end: number, factor: number): number {
  return start + (end - start) * factor;
}

/**
 * Add random variation to a value
 * @param value Base value
 * @param variationPercent Variation percentage (0-1)
 * @returns Value with random variation
 */
export function addVariation(value: number, variationPercent: number): number {
  const variation = value * variationPercent * (Math.random() * 2 - 1);
  return value + variation;
}
