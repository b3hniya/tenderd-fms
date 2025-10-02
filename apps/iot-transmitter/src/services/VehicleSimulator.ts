import type { TelemetryData } from '../types/telemetry.types.js';
import { TelemetryGenerator } from './TelemetryGenerator.js';
import { BufferManager } from './BufferManager.js';
import { OpenAPI, TelemetryService } from '@tenderd-fms/api-client';
import logger from '../utils/logger.js';

/**
 * Vehicle simulator configuration
 */
export interface VehicleSimulatorConfig {
  vehicleId: string;
  deviceId: string;
  transmitInterval: number;
  maxBufferSize: number;
  generator: TelemetryGenerator;
}

/**
 * Connection status enum
 */
export enum ConnectionStatus {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  FLUSHING = 'FLUSHING',
}

/**
 * VehicleSimulator orchestrates telemetry generation and transmission
 * Handles online/offline states and buffer management
 */
export class VehicleSimulator {
  private readonly vehicleId: string;
  private readonly deviceId: string;
  private readonly transmitInterval: number;
  private readonly generator: TelemetryGenerator;
  private readonly bufferManager: BufferManager;

  private timer: NodeJS.Timeout | null = null;
  private isOnline: boolean = true;
  private status: ConnectionStatus = ConnectionStatus.ONLINE;
  private offlineTimer: NodeJS.Timeout | null = null;

  constructor(config: VehicleSimulatorConfig) {
    this.vehicleId = config.vehicleId;
    this.deviceId = config.deviceId;
    this.transmitInterval = config.transmitInterval;
    this.generator = config.generator;
    this.bufferManager = new BufferManager(config.maxBufferSize);

    logger.info('🚗 VehicleSimulator created', {
      vehicleId: this.vehicleId,
      deviceId: this.deviceId,
      transmitInterval: this.transmitInterval,
    });
  }

  /**
   * Start the simulator - begins telemetry generation and transmission loop
   */
  start(): void {
    if (this.timer) {
      logger.warn('Simulator already running', { vehicleId: this.vehicleId });
      return;
    }

    logger.info('▶️  Starting simulator', { vehicleId: this.vehicleId });

    this.timer = setInterval(() => {
      this.tick();
    }, this.transmitInterval);

    this.tick();
  }

  /**
   * Stop the simulator gracefully
   * Clears timer and flushes any buffered data
   */
  async stop(): Promise<void> {
    logger.info('⏹️  Stopping simulator', {
      vehicleId: this.vehicleId,
      bufferedItems: this.bufferManager.size,
    });

    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    if (this.offlineTimer) {
      clearTimeout(this.offlineTimer);
      this.offlineTimer = null;
    }

    if (!this.bufferManager.isEmpty) {
      logger.info('📤 Flushing buffer before shutdown', {
        vehicleId: this.vehicleId,
        items: this.bufferManager.size,
      });
      await this.flushBuffer();
    }

    logger.info('✅ Simulator stopped', { vehicleId: this.vehicleId });
  }

  /**
   * Simulate offline mode for a specified duration
   */
  simulateOffline(durationMs: number): void {
    if (!this.isOnline) {
      logger.warn('Already offline', { vehicleId: this.vehicleId });
      return;
    }

    logger.warn('📡 Simulating offline mode', {
      vehicleId: this.vehicleId,
      duration: `${(durationMs / 1000).toFixed(0)}s`,
    });

    this.isOnline = false;
    this.status = ConnectionStatus.OFFLINE;

    if (this.offlineTimer) {
      clearTimeout(this.offlineTimer);
    }

    this.offlineTimer = setTimeout(() => {
      this.onReconnect();
    }, durationMs);
  }

  /**
   * Main loop tick - generates and transmits/buffers telemetry
   */
  private tick(): void {
    try {
      this.generateAndSend();
    } catch (error) {
      logger.error('Error in tick', {
        vehicleId: this.vehicleId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Generate telemetry and either send or buffer it
   */
  private async generateAndSend(): Promise<void> {
    const telemetry = this.generator.generate(new Date());

    if (this.isOnline) {
      await this.sendTelemetry(telemetry);
    } else {
      this.bufferManager.add(telemetry);
      logger.debug('📦 Telemetry buffered', {
        vehicleId: this.vehicleId,
        bufferSize: this.bufferManager.size,
        bufferUtilization: `${this.bufferManager.utilization.toFixed(1)}%`,
      });
    }
  }

  /**
   * Send telemetry to the API
   */
  private async sendTelemetry(data: TelemetryData): Promise<void> {
    try {
      await TelemetryService.postApiTelemetry({
        vehicleId: this.vehicleId,
        location: data.location,
        speed: data.speed,
        fuelLevel: data.fuelLevel,
        odometer: data.odometer,
        engineTemp: data.engineTemp,
        engineRPM: data.engineRPM,
        timestamp: data.timestamp.toISOString(),
        deviceId: this.deviceId,
      });

      logger.debug('✅ Telemetry sent', {
        vehicleId: this.vehicleId,
        speed: data.speed.toFixed(1),
        location: `${data.location.lat.toFixed(4)}, ${data.location.lng.toFixed(4)}`,
      });
    } catch (error) {
      logger.error('❌ Failed to send telemetry - going offline', {
        vehicleId: this.vehicleId,
        error: error instanceof Error ? error.message : String(error),
      });

      this.isOnline = false;
      this.status = ConnectionStatus.OFFLINE;
      this.bufferManager.add(data);
    }
  }

  /**
   * Flush all buffered telemetry in sequential batches
   */
  private async flushBuffer(): Promise<void> {
    if (this.bufferManager.isEmpty) {
      return;
    }

    this.status = ConnectionStatus.FLUSHING;

    const batches = this.bufferManager.getBatches(50);
    logger.info('📤 Flushing buffer', {
      vehicleId: this.vehicleId,
      totalItems: this.bufferManager.size,
      batches: batches.length,
    });

    let successCount = 0;
    let failedBatches = 0;

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];

      try {
        await TelemetryService.postApiTelemetryBatch({
          vehicleId: this.vehicleId,
          telemetryData: batch.map(item => ({
            location: item.location,
            speed: item.speed,
            fuelLevel: item.fuelLevel,
            odometer: item.odometer,
            engineTemp: item.engineTemp,
            engineRPM: item.engineRPM,
            timestamp: item.timestamp.toISOString(),
          })),
          deviceId: this.deviceId,
        });

        successCount += batch.length;
        logger.debug('✅ Batch sent', {
          vehicleId: this.vehicleId,
          batch: `${i + 1}/${batches.length}`,
          items: batch.length,
        });
      } catch (error) {
        failedBatches++;
        logger.error('❌ Batch send failed', {
          vehicleId: this.vehicleId,
          batch: `${i + 1}/${batches.length}`,
          error: error instanceof Error ? error.message : String(error),
        });

        this.isOnline = false;
        this.status = ConnectionStatus.OFFLINE;
        return;
      }
    }

    if (failedBatches === 0) {
      this.bufferManager.clear();
      logger.info('✅ Buffer flushed successfully', {
        vehicleId: this.vehicleId,
        itemsSent: successCount,
      });
    }
  }

  /**
   * Handle reconnection after offline period
   */
  private async onReconnect(): Promise<void> {
    logger.info('📡 Reconnecting', {
      vehicleId: this.vehicleId,
      bufferedItems: this.bufferManager.size,
    });

    this.isOnline = true;
    this.status = ConnectionStatus.ONLINE;

    if (!this.bufferManager.isEmpty) {
      await this.flushBuffer();
    }

    if (this.isOnline) {
      this.status = ConnectionStatus.ONLINE;
      logger.info('✅ Reconnected successfully', { vehicleId: this.vehicleId });
    }
  }

  /**
   * Get buffer size
   */
  get bufferSize(): number {
    return this.bufferManager.size;
  }

  /**
   * Get current speed
   */
  get currentSpeed(): number {
    return this.generator.getState().speed;
  }

  /**
   * Get current position
   */
  get currentPosition(): { lat: number; lng: number } {
    return this.generator.getState().position;
  }

  /**
   * Get connection status
   */
  get connectionStatus(): ConnectionStatus {
    return this.status;
  }

  /**
   * Get vehicle ID
   */
  get id(): string {
    return this.vehicleId;
  }

  /**
   * Get comprehensive simulator status
   */
  getStatus() {
    const generatorState = this.generator.getState();
    const bufferStats = this.bufferManager.getStats();

    return {
      vehicleId: this.vehicleId,
      deviceId: this.deviceId,
      connectionStatus: this.status,
      isOnline: this.isOnline,
      position: generatorState.position,
      speed: generatorState.speed,
      fuelLevel: generatorState.fuelLevel,
      odometer: generatorState.odometer,
      engineTemp: generatorState.engineTemp,
      route: generatorState.route,
      buffer: {
        size: bufferStats.size,
        capacity: bufferStats.capacity,
        utilization: bufferStats.utilization,
        isEmpty: bufferStats.isEmpty,
        isFull: bufferStats.isFull,
      },
    };
  }
}
