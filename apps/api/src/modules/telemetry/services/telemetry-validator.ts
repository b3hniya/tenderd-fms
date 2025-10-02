interface TelemetryData {
  location: { lat: number; lng: number };
  speed: number;
  fuelLevel: number;
  odometer: number;
  engineTemp: number;
  timestamp: Date;
}

interface ValidationResult {
  schemaValid: boolean;
  contextValid: boolean;
  issues: string[];
  severity?: "LOW" | "MEDIUM" | "HIGH";
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

function validateTimestampSequence(current: TelemetryData, previous: any, issues: string[]): "HIGH" | undefined {
  const currentTimestamp = new Date(current.timestamp).getTime();
  const previousTimestamp = new Date(previous.timestamp).getTime();
  const timeDiffSeconds = (currentTimestamp - previousTimestamp) / 1000;

  if (timeDiffSeconds < 0) {
    issues.push("Timestamp is before previous telemetry");
    return "HIGH";
  }
  return undefined;
}

function validateOdometerIntegrity(current: TelemetryData, previous: any, issues: string[]): "MEDIUM" | undefined {
  if (current.odometer < previous.odometer) {
    issues.push(`Odometer decreased from ${previous.odometer} to ${current.odometer}`);
    return "MEDIUM";
  }
  return undefined;
}

function validateLocationJump(
  current: TelemetryData,
  previous: any,
  timeDiffSeconds: number,
  issues: string[]
): "HIGH" | undefined {
  if (!previous.location || !previous.location.coordinates) {
    return undefined;
  }

  const [prevLng, prevLat] = previous.location.coordinates;
  const distance = calculateDistance(prevLat, prevLng, current.location.lat, current.location.lng);

  const maxPossibleDistance = (300 / 3600) * timeDiffSeconds;

  if (distance > maxPossibleDistance * 1.5) {
    issues.push(`Unrealistic location jump: ${distance.toFixed(2)}km in ${timeDiffSeconds}s`);
    return "HIGH";
  }
  return undefined;
}

function validateFuelLevel(
  current: TelemetryData,
  previous: any,
  timeDiffSeconds: number,
  issues: string[]
): "LOW" | "MEDIUM" | undefined {
  const fuelDiff = current.fuelLevel - previous.fuelLevel;

  if (fuelDiff > 5) {
    issues.push(`Fuel level increased by ${fuelDiff.toFixed(1)}% (possible refuel?)`);
    return "LOW";
  }

  if (fuelDiff < -50 && timeDiffSeconds < 3600) {
    issues.push(
      `Extreme fuel consumption: ${Math.abs(fuelDiff).toFixed(1)}% in ${Math.round(timeDiffSeconds / 60)}min`
    );
    return "MEDIUM";
  }

  return undefined;
}

function validateEngineTemperature(current: TelemetryData, issues: string[]): "MEDIUM" | undefined {
  if (current.engineTemp > 120) {
    issues.push(`High engine temperature: ${current.engineTemp}°C`);
    return "MEDIUM";
  }

  if (current.engineTemp < -10 && current.speed > 0) {
    issues.push(`Unusually low engine temp (${current.engineTemp}°C) while moving`);
    return "MEDIUM";
  }

  return undefined;
}

function validateSpeedOdometerConsistency(
  current: TelemetryData,
  previous: any,
  timeDiffSeconds: number,
  issues: string[]
): "MEDIUM" | undefined {
  if (timeDiffSeconds <= 0) {
    return undefined;
  }

  const odometerDiff = current.odometer - previous.odometer;
  const avgSpeed = (odometerDiff / timeDiffSeconds) * 3600;
  const reportedAvgSpeed = (current.speed + previous.speed) / 2;

  if (Math.abs(avgSpeed - reportedAvgSpeed) > 50 && odometerDiff > 1) {
    issues.push(
      `Speed/odometer mismatch: calculated ${avgSpeed.toFixed(1)}km/h vs reported ${reportedAvgSpeed.toFixed(1)}km/h`
    );
    return "MEDIUM";
  }

  return undefined;
}

function getHighestSeverity(severities: Array<"LOW" | "MEDIUM" | "HIGH" | undefined>): "LOW" | "MEDIUM" | "HIGH" {
  if (severities.includes("HIGH")) return "HIGH";
  if (severities.includes("MEDIUM")) return "MEDIUM";
  return "LOW";
}

export function validateTelemetryContext(current: TelemetryData, previous: any | null): ValidationResult {
  if (!previous) {
    return {
      schemaValid: true,
      contextValid: true,
      issues: [],
    };
  }

  const issues: string[] = [];
  const severities: Array<"LOW" | "MEDIUM" | "HIGH" | undefined> = [];

  const currentTimestamp = new Date(current.timestamp).getTime();
  const previousTimestamp = new Date(previous.timestamp).getTime();
  const timeDiffSeconds = (currentTimestamp - previousTimestamp) / 1000;

  severities.push(validateTimestampSequence(current, previous, issues));
  severities.push(validateOdometerIntegrity(current, previous, issues));
  severities.push(validateLocationJump(current, previous, timeDiffSeconds, issues));
  severities.push(validateFuelLevel(current, previous, timeDiffSeconds, issues));
  severities.push(validateEngineTemperature(current, issues));
  severities.push(validateSpeedOdometerConsistency(current, previous, timeDiffSeconds, issues));

  return {
    schemaValid: true,
    contextValid: issues.length === 0,
    issues,
    severity: issues.length > 0 ? getHighestSeverity(severities) : undefined,
  };
}
