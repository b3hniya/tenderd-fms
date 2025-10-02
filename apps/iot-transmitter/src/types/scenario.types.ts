/**
 * Corruption types that can be applied to telemetry data
 */
export enum CorruptionType {
  LOCATION_JUMP = 'location-jump',
  ODOMETER_DECREASE = 'odometer-decrease',
  EXTREME_SPEED = 'extreme-speed',
  FUEL_ANOMALY = 'fuel-anomaly',
  TEMPERATURE_SPIKE = 'temperature-spike',
}

/**
 * Configuration for a single scenario
 */
export interface ScenarioConfig {
  /** Human-readable scenario name */
  name: string;

  /** Number of vehicles to simulate */
  vehicles: number;

  /** Interval between telemetry transmissions (ms) */
  transmitInterval: number;

  /** Probability of random offline events (0-1) */
  offlineProbability?: number;

  /** Rate of data corruption (0-1) */
  corruptionRate?: number;

  /** Types of corruption to apply */
  corruptionTypes?: CorruptionType[];

  /** Specific time to trigger offline (ms after start) */
  offlineAt?: number;

  /** Duration of offline period (ms) */
  offlineDuration?: number;
}

/**
 * Collection of all available scenarios
 */
export interface ScenariosConfig {
  normal: ScenarioConfig;
  'offline-test': ScenarioConfig;
  'corrupted-data': ScenarioConfig;
  'fleet-stress': ScenarioConfig;
  [key: string]: ScenarioConfig;
}

/**
 * Configuration for a single vehicle simulator
 */
export interface VehicleConfig {
  /** Unique vehicle identifier (MongoDB ObjectId) */
  vehicleId: string;

  /** Device identifier for telemetry */
  deviceId: string;

  /** Route index to follow */
  routeIndex: number;

  /** Initial odometer reading (km) */
  initialOdometer: number;

  /** Initial fuel level (%) */
  initialFuelLevel: number;
}

/**
 * Application configuration
 */
export interface AppConfig {
  /** API base URL */
  apiBaseUrl: string;

  /** Log level */
  logLevel: 'debug' | 'info' | 'warn' | 'error';

  /** Whether to log to file */
  logToFile: boolean;

  /** Default transmit interval (ms) */
  transmitInterval: number;

  /** Maximum buffer size */
  maxBufferSize: number;

  /** Selected scenario */
  scenario: string;

  /** Scenario configuration */
  scenarioConfig: ScenarioConfig;
}
