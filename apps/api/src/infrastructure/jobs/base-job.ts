import * as cron from "node-cron";
import logger from "../configs/logger";

export interface JobConfig {
  name: string;
  cronExpression: string;
  enabled?: boolean;
  timezone?: string;
}

/**
 * Base class for background jobs with cron scheduling
 *
 * @example
 * ```typescript
 * class MyJob extends BaseJob {
 *   constructor() {
 *     super({
 *       name: 'MyJob',
 *       cronExpression: '* * * * *', // Every minute
 *       enabled: true
 *     });
 *   }
 *
 *   async execute(): Promise<void> {
 *     // Job logic here
 *   }
 * }
 * ```
 */
export abstract class BaseJob {
  protected task: cron.ScheduledTask | null = null;
  protected isRunning = false;
  protected lastRun: Date | null = null;
  protected runCount = 0;
  protected errorCount = 0;

  constructor(protected config: JobConfig) {}

  /**
   * Execute the job logic (to be implemented by subclasses)
   */
  abstract execute(): Promise<void>;

  /**
   * Start the job scheduler
   */
  start(): void {
    if (this.task) {
      logger.warn(`Job ${this.config.name} is already running`);
      return;
    }

    if (this.config.enabled === false) {
      logger.info(`Job ${this.config.name} is disabled, skipping start`);
      return;
    }

    logger.info(`Starting job: ${this.config.name} with schedule: ${this.config.cronExpression}`);

    this.task = cron.schedule(
      this.config.cronExpression,
      async () => {
        await this.run();
      },
      {
        timezone: this.config.timezone || "UTC",
      }
    );

    logger.info(`✅ Job ${this.config.name} started successfully`);
  }

  /**
   * Stop the job scheduler
   */
  stop(): void {
    if (this.task) {
      this.task.stop();
      this.task = null;
      logger.info(`Job ${this.config.name} stopped`);
    }
  }

  /**
   * Run the job once (called by cron)
   */
  private async run(): Promise<void> {
    if (this.isRunning) {
      logger.warn(`Job ${this.config.name} is already running, skipping this execution`);
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();

    try {
      logger.debug(`Executing job: ${this.config.name}`);
      await this.execute();

      this.lastRun = new Date();
      this.runCount++;

      const duration = Date.now() - startTime;
      logger.debug(`Job ${this.config.name} completed in ${duration}ms`);
    } catch (error) {
      this.errorCount++;
      logger.error(`Error in job ${this.config.name}:`, error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Get job health status
   */
  getStatus() {
    return {
      name: this.config.name,
      schedule: this.config.cronExpression,
      enabled: this.config.enabled !== false,
      isActive: this.task !== null,
      isRunning: this.isRunning,
      lastRun: this.lastRun,
      runCount: this.runCount,
      errorCount: this.errorCount,
    };
  }
}
