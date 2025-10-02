import type { ScenarioConfig } from '../types/scenario.types.js';
import { VehicleSimulator, ConnectionStatus } from '../services/VehicleSimulator.js';
import { TelemetryGenerator } from '../services/TelemetryGenerator.js';
import { OpenAPI } from '@tenderd-fms/api-client';
import { getRoute, getRandomPosition } from '../utils/route-generator.js';
import { CorruptionType } from '../types/scenario.types.js';
import logger from '../utils/logger.js';

/**
 * ScenarioRunner manages multiple vehicle simulators based on scenario configuration
 */
export class ScenarioRunner {
  private readonly scenarioConfig: ScenarioConfig;
  private simulators: VehicleSimulator[] = [];
  private offlineTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor(scenarioConfig: ScenarioConfig, apiBaseUrl: string) {
    this.scenarioConfig = scenarioConfig;

    OpenAPI.BASE = apiBaseUrl;

    logger.info('🎬 ScenarioRunner created', {
      scenario: scenarioConfig.name,
      vehicles: scenarioConfig.vehicles,
      transmitInterval: scenarioConfig.transmitInterval,
    });
  }

  /**
   * Initialize all vehicle simulators
   */
  initialize(): void {
    logger.info('🔧 Initializing vehicle simulators', {
      count: this.scenarioConfig.vehicles,
    });

    for (let i = 0; i < this.scenarioConfig.vehicles; i++) {
      const vehicleId = this.generateVehicleId(i);
      const simulator = this.createSimulator(vehicleId, i);
      this.simulators.push(simulator);
    }

    logger.info('✅ All simulators initialized', {
      count: this.simulators.length,
    });
  }

  /**
   * Create a single vehicle simulator
   */
  private createSimulator(vehicleId: string, index: number): VehicleSimulator {
    const route = this.assignRoute(index);
    const initialPosition = getRandomPosition(route);

    const initialOdometer = 50000 + Math.random() * 150000;
    const initialFuelLevel = 60 + Math.random() * 35;

    const corruptionTypes = this.scenarioConfig.corruptionTypes?.map(type => {
      switch (type) {
        case 'location-jump':
          return CorruptionType.LOCATION_JUMP;
        case 'odometer-decrease':
          return CorruptionType.ODOMETER_DECREASE;
        case 'extreme-speed':
          return CorruptionType.EXTREME_SPEED;
        case 'fuel-anomaly':
          return CorruptionType.FUEL_ANOMALY;
        case 'temperature-spike':
          return CorruptionType.TEMPERATURE_SPIKE;
        default:
          return CorruptionType.LOCATION_JUMP;
      }
    });

    const generator = new TelemetryGenerator({
      route,
      initialPosition,
      initialOdometer,
      initialFuelLevel,
      corruptionRate: this.scenarioConfig.corruptionRate,
      corruptionTypes,
    });

    const simulator = new VehicleSimulator({
      vehicleId,
      deviceId: `simulator-${vehicleId}`,
      transmitInterval: this.scenarioConfig.transmitInterval,
      maxBufferSize: 500,
      generator,
    });

    logger.debug('🚗 Simulator created', {
      vehicleId,
      route: route.name,
      initialPosition: {
        lat: initialPosition.lat.toFixed(4),
        lng: initialPosition.lng.toFixed(4),
      },
      initialOdometer: initialOdometer.toFixed(0),
      initialFuelLevel: initialFuelLevel.toFixed(1),
    });

    return simulator;
  }

  /**
   * Assign a route to a vehicle based on index
   * Distributes routes evenly among vehicles
   */
  private assignRoute(index: number) {
    return getRoute(index);
  }

  /**
   * Generate a vehicle ID (simulated MongoDB ObjectId)
   */
  private generateVehicleId(index: number): string {
    const timestamp = Math.floor(Date.now() / 1000)
      .toString(16)
      .padStart(8, '0');
    const machineId = '000000';
    const processId = '0000';
    const counter = index.toString(16).padStart(6, '0');
    return `${timestamp}${machineId}${processId}${counter}`;
  }

  /**
   * Start all vehicle simulators
   */
  start(): void {
    if (this.simulators.length === 0) {
      logger.warn('No simulators to start. Call initialize() first.');
      return;
    }

    logger.info('▶️  Starting all simulators', {
      count: this.simulators.length,
      scenario: this.scenarioConfig.name,
    });

    this.simulators.forEach(simulator => {
      simulator.start();
    });

    this.scheduleScenarioEvents();

    logger.info('✅ All simulators started', {
      count: this.simulators.length,
    });
  }

  /**
   * Stop all simulators gracefully
   */
  async stop(): Promise<void> {
    logger.info('⏹️  Stopping all simulators', {
      count: this.simulators.length,
    });

    this.offlineTimers.forEach(timer => clearTimeout(timer));
    this.offlineTimers.clear();

    await Promise.all(this.simulators.map(simulator => simulator.stop()));

    logger.info('✅ All simulators stopped', {
      count: this.simulators.length,
    });
  }

  /**
   * Schedule scenario-specific events
   */
  private scheduleScenarioEvents(): void {
    if (
      this.scenarioConfig.offlineAt !== undefined &&
      this.scenarioConfig.offlineDuration !== undefined
    ) {
      this.simulators.forEach(simulator => {
        this.scheduleOfflineEvent(simulator, this.scenarioConfig);
      });
    }

    if (
      this.scenarioConfig.offlineProbability !== undefined &&
      this.scenarioConfig.offlineProbability > 0
    ) {
      this.simulators.forEach(simulator => {
        this.scheduleRandomOfflines(simulator, this.scenarioConfig.offlineProbability!);
      });
    }
  }

  /**
   * Schedule a specific offline event for a simulator
   */
  private scheduleOfflineEvent(simulator: VehicleSimulator, config: ScenarioConfig): void {
    if (config.offlineAt === undefined || config.offlineDuration === undefined) {
      return;
    }

    const timer = setTimeout(() => {
      logger.warn('⏰ Triggering scheduled offline event', {
        vehicleId: simulator.id,
        duration: `${(config.offlineDuration! / 1000).toFixed(0)}s`,
      });

      simulator.simulateOffline(config.offlineDuration!);
    }, config.offlineAt);

    this.offlineTimers.set(simulator.id, timer);
  }

  /**
   * Schedule random offline events based on probability
   */
  private scheduleRandomOfflines(simulator: VehicleSimulator, probability: number): void {
    const checkInterval = 60000;

    const check = () => {
      if (Math.random() < probability) {
        const duration = (5 + Math.random() * 15) * 60 * 1000;

        logger.warn('🎲 Random offline event triggered', {
          vehicleId: simulator.id,
          duration: `${(duration / 1000 / 60).toFixed(1)}min`,
        });

        simulator.simulateOffline(duration);
      }

      const timer = setTimeout(check, checkInterval);
      this.offlineTimers.set(`${simulator.id}-random`, timer);
    };

    check();
  }

  /**
   * Get aggregate status of all vehicles
   */
  getStatus() {
    const statuses = this.simulators.map(sim => sim.getStatus());

    const summary = {
      scenario: this.scenarioConfig.name,
      totalVehicles: this.simulators.length,
      online: statuses.filter(s => s.connectionStatus === ConnectionStatus.ONLINE).length,
      offline: statuses.filter(s => s.connectionStatus === ConnectionStatus.OFFLINE).length,
      flushing: statuses.filter(s => s.connectionStatus === ConnectionStatus.FLUSHING).length,
      totalBuffered: statuses.reduce((sum, s) => sum + s.buffer.size, 0),
      averageSpeed: statuses.reduce((sum, s) => sum + s.speed, 0) / statuses.length,
      averageFuelLevel: statuses.reduce((sum, s) => sum + s.fuelLevel, 0) / statuses.length,
    };

    return {
      summary,
      vehicles: statuses,
    };
  }

  /**
   * Get list of all simulators
   */
  getSimulators(): VehicleSimulator[] {
    return this.simulators;
  }

  /**
   * Get scenario configuration
   */
  getScenarioConfig(): ScenarioConfig {
    return this.scenarioConfig;
  }
}
