/**
 * Reconnection strategy utilities
 * Provides exponential backoff and jitter for reconnection attempts
 */

/**
 * Options for reconnection strategy
 */
export interface ReconnectStrategyOptions {
  /**
   * Initial delay in milliseconds
   * @default 1000
   */
  initialDelay?: number;

  /**
   * Maximum delay in milliseconds
   * @default 30000
   */
  maxDelay?: number;

  /**
   * Multiplier for exponential backoff
   * @default 2
   */
  multiplier?: number;

  /**
   * Maximum number of attempts (0 = infinite)
   * @default 0
   */
  maxAttempts?: number;

  /**
   * Add random jitter to prevent thundering herd
   * @default true
   */
  jitter?: boolean;
}

const DEFAULT_OPTIONS: Required<ReconnectStrategyOptions> = {
  initialDelay: 1000,
  maxDelay: 30000,
  multiplier: 2,
  maxAttempts: 0,
  jitter: true,
};

/**
 * Calculate reconnection delay with exponential backoff
 *
 * @example
 * ```typescript
 * const delay = calculateReconnectDelay(3); // 3rd attempt
 * // Returns: ~8000ms (with jitter)
 * ```
 */
export function calculateReconnectDelay(
  attemptNumber: number,
  options: ReconnectStrategyOptions = {},
): number {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Calculate exponential delay: initialDelay * (multiplier ^ attemptNumber)
  let delay = opts.initialDelay * Math.pow(opts.multiplier, attemptNumber);

  // Cap at maxDelay
  delay = Math.min(delay, opts.maxDelay);

  // Add jitter (±25% random variation)
  if (opts.jitter) {
    const jitterRange = delay * 0.25;
    const randomJitter = Math.random() * jitterRange * 2 - jitterRange;
    delay = Math.max(0, delay + randomJitter);
  }

  return Math.floor(delay);
}

/**
 * Check if should continue reconnecting
 */
export function shouldContinueReconnecting(
  attemptNumber: number,
  maxAttempts: number = 0,
): boolean {
  if (maxAttempts === 0) return true; // Infinite attempts
  return attemptNumber < maxAttempts;
}

/**
 * Reconnection strategy class for managing reconnection state
 */
export class ReconnectStrategy {
  private attemptNumber = 0;
  private options: Required<ReconnectStrategyOptions>;

  constructor(options: ReconnectStrategyOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Get the delay for the next reconnection attempt
   */
  getNextDelay(): number {
    return calculateReconnectDelay(this.attemptNumber, this.options);
  }

  /**
   * Check if should attempt reconnection
   */
  shouldReconnect(): boolean {
    return shouldContinueReconnecting(this.attemptNumber, this.options.maxAttempts);
  }

  /**
   * Increment attempt counter
   */
  incrementAttempt(): void {
    this.attemptNumber++;
  }

  /**
   * Reset attempt counter (call on successful connection)
   */
  reset(): void {
    this.attemptNumber = 0;
  }

  /**
   * Get current attempt number
   */
  getCurrentAttempt(): number {
    return this.attemptNumber;
  }
}
