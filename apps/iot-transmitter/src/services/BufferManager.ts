import type { TelemetryData } from '../types/telemetry.types.js';
import logger from '../utils/logger.js';

/**
 * BufferManager handles offline data buffering with FIFO overflow handling
 *
 * When the vehicle is offline, telemetry data is stored in a buffer.
 * Once the buffer is full, the oldest data is dropped (FIFO - First In, First Out).
 * When the vehicle reconnects, the buffer is flushed to the API in batches.
 */
export class BufferManager {
  private buffer: TelemetryData[] = [];
  private readonly maxSize: number;

  /**
   * Create a new BufferManager
   * @param maxSize Maximum number of telemetry records to buffer (default: 500)
   */
  constructor(maxSize: number = 500) {
    if (maxSize < 1) {
      throw new Error('Buffer maxSize must be at least 1');
    }
    this.maxSize = maxSize;
  }

  /**
   * Add telemetry data to the buffer
   * If buffer is full, removes oldest item (FIFO)
   *
   * @param data Telemetry data to buffer
   */
  add(data: TelemetryData): void {
    if (this.buffer.length >= this.maxSize) {
      const dropped = this.buffer.shift();
      logger.warn('📦 Buffer full - dropping oldest telemetry', {
        droppedTimestamp: dropped?.timestamp,
        bufferSize: this.buffer.length,
      });
    }

    this.buffer.push(data);
  }

  /**
   * Get all buffered telemetry data, sorted by timestamp (oldest first)
   *
   * @returns Array of telemetry data sorted by timestamp
   */
  getAll(): TelemetryData[] {
    return [...this.buffer].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  /**
   * Split buffered data into batches for transmission
   *
   * @param batchSize Number of items per batch (default: 50)
   * @returns Array of batches, each containing up to batchSize items
   */
  getBatches(batchSize: number = 50): TelemetryData[][] {
    if (batchSize < 1) {
      throw new Error('Batch size must be at least 1');
    }

    const sortedData = this.getAll();
    const batches: TelemetryData[][] = [];

    for (let i = 0; i < sortedData.length; i += batchSize) {
      batches.push(sortedData.slice(i, i + batchSize));
    }

    return batches;
  }

  /**
   * Clear all buffered data
   */
  clear(): void {
    const clearedCount = this.buffer.length;
    this.buffer = [];

    if (clearedCount > 0) {
      logger.debug('🧹 Buffer cleared', { itemsCleared: clearedCount });
    }
  }

  /**
   * Get the current number of items in the buffer
   */
  get size(): number {
    return this.buffer.length;
  }

  /**
   * Check if the buffer is empty
   */
  get isEmpty(): boolean {
    return this.buffer.length === 0;
  }

  /**
   * Get the maximum buffer size
   */
  get capacity(): number {
    return this.maxSize;
  }

  /**
   * Get buffer utilization as a percentage (0-100)
   */
  get utilization(): number {
    return (this.buffer.length / this.maxSize) * 100;
  }

  /**
   * Check if buffer is full
   */
  get isFull(): boolean {
    return this.buffer.length >= this.maxSize;
  }

  /**
   * Get buffer statistics
   */
  getStats(): {
    size: number;
    capacity: number;
    utilization: number;
    isEmpty: boolean;
    isFull: boolean;
    oldestTimestamp?: Date;
    newestTimestamp?: Date;
  } {
    const sorted = this.getAll();
    return {
      size: this.size,
      capacity: this.capacity,
      utilization: this.utilization,
      isEmpty: this.isEmpty,
      isFull: this.isFull,
      oldestTimestamp: sorted[0]?.timestamp,
      newestTimestamp: sorted[sorted.length - 1]?.timestamp,
    };
  }
}
