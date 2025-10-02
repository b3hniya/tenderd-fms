import type { TelemetryData } from '../types/telemetry.types.js';
import { CorruptionType } from '../types/scenario.types.js';
import logger from '../utils/logger.js';

/**
 * Corrupt telemetry by teleporting the vehicle to a random location
 * This simulates an unrealistic location jump that should be flagged by validation
 */
export function corruptLocationJump(data: TelemetryData): TelemetryData {
  const jumpDistance = 0.5 + Math.random() * 1.0;
  const jumpDirection = Math.random() * 2 * Math.PI;

  const newLat = data.location.lat + jumpDistance * Math.cos(jumpDirection);
  const newLng = data.location.lng + jumpDistance * Math.sin(jumpDirection);

  logger.debug('🔧 Applied corruption: location-jump', {
    originalLat: data.location.lat,
    originalLng: data.location.lng,
    newLat,
    newLng,
    jumpDistance,
  });

  return {
    ...data,
    location: {
      lat: newLat,
      lng: newLng,
    },
  };
}

/**
 * Corrupt telemetry by decreasing the odometer
 * This is physically impossible and should be flagged by validation
 */
export function corruptOdometerDecrease(data: TelemetryData): TelemetryData {
  const decrease = 100 + Math.random() * 500;
  const newOdometer = Math.max(0, data.odometer - decrease);

  logger.debug('🔧 Applied corruption: odometer-decrease', {
    originalOdometer: data.odometer,
    newOdometer,
    decrease,
  });

  return {
    ...data,
    odometer: newOdometer,
  };
}

/**
 * Corrupt telemetry with an impossible speed value
 * Exceeds realistic vehicle capabilities
 */
export function corruptExtremeSpeed(data: TelemetryData): TelemetryData {
  const extremeSpeed = 250 + Math.random() * 100;

  logger.debug('🔧 Applied corruption: extreme-speed', {
    originalSpeed: data.speed,
    newSpeed: extremeSpeed,
  });

  return {
    ...data,
    speed: extremeSpeed,
    engineRPM: data.engineRPM ? Math.min(data.engineRPM * 2, 9000) : 8000,
  };
}

/**
 * Corrupt telemetry with sudden fuel level change
 * Simulates unrealistic fuel consumption or gain
 */
export function corruptFuelAnomaly(data: TelemetryData): TelemetryData {
  const anomalyType = Math.random() > 0.5 ? 'sudden-drop' : 'sudden-gain';

  let newFuelLevel: number;
  if (anomalyType === 'sudden-drop') {
    newFuelLevel = Math.max(0, data.fuelLevel - (30 + Math.random() * 40));
  } else {
    newFuelLevel = Math.min(100, data.fuelLevel + (20 + Math.random() * 30));
  }

  logger.debug('🔧 Applied corruption: fuel-anomaly', {
    type: anomalyType,
    originalFuelLevel: data.fuelLevel,
    newFuelLevel,
  });

  return {
    ...data,
    fuelLevel: newFuelLevel,
  };
}

/**
 * Corrupt telemetry with extreme engine temperature
 */
export function corruptTemperatureSpike(data: TelemetryData): TelemetryData {
  const spikeTemp = 150 + Math.random() * 30;

  logger.debug('🔧 Applied corruption: temperature-spike', {
    originalTemp: data.engineTemp,
    newTemp: spikeTemp,
  });

  return {
    ...data,
    engineTemp: spikeTemp,
  };
}

/**
 * Map corruption types to their handler functions
 */
const CORRUPTION_HANDLERS: Record<CorruptionType, (data: TelemetryData) => TelemetryData> = {
  [CorruptionType.LOCATION_JUMP]: corruptLocationJump,
  [CorruptionType.ODOMETER_DECREASE]: corruptOdometerDecrease,
  [CorruptionType.EXTREME_SPEED]: corruptExtremeSpeed,
  [CorruptionType.FUEL_ANOMALY]: corruptFuelAnomaly,
  [CorruptionType.TEMPERATURE_SPIKE]: corruptTemperatureSpike,
};

/**
 * Apply random corruption to telemetry data based on rate and allowed types
 *
 * @param data Original telemetry data
 * @param types Array of allowed corruption types
 * @param rate Probability of corruption (0-1)
 * @returns Potentially corrupted telemetry data
 */
export function applyRandomCorruption(
  data: TelemetryData,
  types: CorruptionType[],
  rate: number,
): TelemetryData {
  if (rate <= 0 || types.length === 0) {
    return data;
  }

  if (Math.random() > rate) {
    return data;
  }

  const randomType = types[Math.floor(Math.random() * types.length)];
  const handler = CORRUPTION_HANDLERS[randomType];

  if (!handler) {
    logger.warn('Unknown corruption type', { type: randomType });
    return data;
  }

  logger.info('💥 Corrupting telemetry', { type: randomType, timestamp: data.timestamp });
  return handler(data);
}
