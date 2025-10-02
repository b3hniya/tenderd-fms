import type { TelemetryData } from '../types/telemetry.types.js';
import type { Route, RoutePosition } from '../utils/route-generator.js';
import { getNextPosition } from '../utils/route-generator.js';
import {
  calculateDistance,
  calculateFuelConsumption,
  calculateRPM,
  calculateEngineTemp,
  addVariation,
} from '../utils/physics.js';
import { applyRandomCorruption } from '../scenarios/CorruptionStrategies.js';
import { CorruptionType } from '../types/scenario.types.js';
import logger from '../utils/logger.js';

/**
 * Configuration for TelemetryGenerator
 */
export interface TelemetryGeneratorConfig {
  route: Route;
  initialPosition: RoutePosition;
  initialOdometer: number;
  initialFuelLevel: number;
  corruptionRate?: number;
  corruptionTypes?: CorruptionType[];
}

/**
 * TelemetryGenerator generates realistic telemetry data for a vehicle
 * Maintains state and simulates vehicle behavior along a route
 */
export class TelemetryGenerator {
  private route: Route;
  private currentPosition: RoutePosition;
  private currentOdometer: number;
  private currentFuelLevel: number;
  private engineTemp: number;
  private lastTimestamp: Date;
  private currentSpeed: number;
  private corruptionRate: number;
  private corruptionTypes: CorruptionType[];

  constructor(config: TelemetryGeneratorConfig) {
    this.route = config.route;
    this.currentPosition = config.initialPosition;
    this.currentOdometer = config.initialOdometer;
    this.currentFuelLevel = config.initialFuelLevel;
    this.engineTemp = 25;
    this.lastTimestamp = new Date();
    this.currentSpeed = config.initialPosition.targetSpeed;
    this.corruptionRate = config.corruptionRate || 0;
    this.corruptionTypes = config.corruptionTypes || [];

    logger.debug('🚗 TelemetryGenerator initialized', {
      route: this.route.name,
      initialPosition: {
        lat: this.currentPosition.lat,
        lng: this.currentPosition.lng,
      },
      initialOdometer: this.currentOdometer,
      initialFuelLevel: this.currentFuelLevel,
    });
  }

  /**
   * Generate telemetry data for the current timestamp
   * Updates internal state and returns telemetry
   */
  generate(timestamp: Date): TelemetryData {
    const deltaTime = timestamp.getTime() - this.lastTimestamp.getTime();

    this.updatePosition(deltaTime);
    const speed = this.calculateSpeed();
    const distanceTraveled = this.calculateDistanceTraveled(deltaTime);

    this.updateOdometer(distanceTraveled);
    this.updateFuelLevel(speed, distanceTraveled);
    this.updateEngineTemp(speed, deltaTime);

    this.currentSpeed = speed;
    this.lastTimestamp = timestamp;

    const telemetry: TelemetryData = {
      location: {
        lat: this.currentPosition.lat,
        lng: this.currentPosition.lng,
      },
      speed: Math.max(0, speed),
      fuelLevel: Math.max(0, Math.min(100, this.currentFuelLevel)),
      odometer: Math.round(this.currentOdometer * 10) / 10,
      engineTemp: Math.round(this.engineTemp),
      engineRPM: speed > 0 ? calculateRPM(speed) : 800,
      timestamp,
    };

    if (this.corruptionRate > 0 && this.corruptionTypes.length > 0) {
      return applyRandomCorruption(telemetry, this.corruptionTypes, this.corruptionRate);
    }

    return telemetry;
  }

  /**
   * Update vehicle position along the route
   */
  private updatePosition(deltaTime: number): void {
    this.currentPosition = getNextPosition(
      this.route,
      this.currentPosition,
      this.currentSpeed,
      deltaTime,
    );
  }

  /**
   * Calculate current speed based on route target speed with realistic variation
   */
  private calculateSpeed(): number {
    const targetSpeed = this.currentPosition.targetSpeed;
    const speedVariation = 0.1;

    const baseSpeed = addVariation(targetSpeed, speedVariation);

    const accelerationFactor = this.engineTemp < 70 ? 0.9 : 1.0;

    return Math.max(0, baseSpeed * accelerationFactor);
  }

  /**
   * Calculate distance traveled since last update
   */
  private calculateDistanceTraveled(deltaTime: number): number {
    const timeInHours = deltaTime / (1000 * 60 * 60);
    return this.currentSpeed * timeInHours;
  }

  /**
   * Update odometer reading
   */
  private updateOdometer(distanceTraveled: number): void {
    this.currentOdometer += distanceTraveled;
  }

  /**
   * Update fuel level based on consumption
   */
  private updateFuelLevel(speed: number, distanceTraveled: number): void {
    if (distanceTraveled > 0) {
      const fuelConsumed = calculateFuelConsumption(speed, distanceTraveled);
      this.currentFuelLevel -= fuelConsumed;

      if (this.currentFuelLevel < 20) {
        logger.debug('⚠️ Low fuel warning', {
          fuelLevel: this.currentFuelLevel,
          odometer: this.currentOdometer,
        });
      }

      if (this.currentFuelLevel <= 0) {
        this.currentFuelLevel = 0;
        logger.warn('⛽ Out of fuel!', { odometer: this.currentOdometer });
      }
    }
  }

  /**
   * Update engine temperature with warm-up and cool-down curves
   */
  private updateEngineTemp(speed: number, deltaTime: number): void {
    this.engineTemp = calculateEngineTemp(this.engineTemp, speed, deltaTime);
  }

  /**
   * Simulate refueling (useful for long-running simulations)
   */
  refuel(amount: number = 100): void {
    const previousLevel = this.currentFuelLevel;
    this.currentFuelLevel = Math.min(100, this.currentFuelLevel + amount);

    logger.info('⛽ Refueled', {
      previousLevel: previousLevel.toFixed(1),
      newLevel: this.currentFuelLevel.toFixed(1),
      added: (this.currentFuelLevel - previousLevel).toFixed(1),
    });
  }

  /**
   * Get current vehicle state (for debugging/monitoring)
   */
  getState() {
    return {
      position: {
        lat: this.currentPosition.lat,
        lng: this.currentPosition.lng,
      },
      odometer: this.currentOdometer,
      fuelLevel: this.currentFuelLevel,
      engineTemp: this.engineTemp,
      speed: this.currentSpeed,
      route: this.route.name,
      waypointIndex: this.currentPosition.waypointIndex,
      progress: this.currentPosition.progress,
    };
  }

  /**
   * Check if vehicle needs refueling
   */
  needsRefuel(): boolean {
    return this.currentFuelLevel < 10;
  }

  /**
   * Enable or disable corruption
   */
  setCorruption(rate: number, types: CorruptionType[]): void {
    this.corruptionRate = rate;
    this.corruptionTypes = types;

    logger.info('🔧 Corruption settings updated', {
      rate,
      types,
    });
  }
}
