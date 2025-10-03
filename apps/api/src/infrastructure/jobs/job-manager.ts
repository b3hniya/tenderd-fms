import { BaseJob } from "./base-job";
import logger from "../configs/logger";

/**
 * Manages all background jobs in the application
 * Provides centralized start/stop and health monitoring
 */
export class JobManager {
  private jobs: Map<string, BaseJob> = new Map();

  /**
   * Register a job with the manager
   */
  register(job: BaseJob): void {
    const status = job.getStatus();

    if (this.jobs.has(status.name)) {
      logger.warn(`Job ${status.name} is already registered, replacing...`);
    }

    this.jobs.set(status.name, job);
    logger.info(`Registered job: ${status.name}`);
  }

  /**
   * Start all registered jobs
   */
  startAll(): void {
    logger.info(`Starting ${this.jobs.size} background job(s)...`);

    for (const [name, job] of this.jobs) {
      try {
        job.start();
      } catch (error) {
        logger.error(`Failed to start job ${name}:`, error);
      }
    }

    logger.info("✅ All background jobs started");
  }

  /**
   * Stop all registered jobs
   */
  stopAll(): void {
    logger.info("Stopping all background jobs...");

    for (const [name, job] of this.jobs) {
      try {
        job.stop();
      } catch (error) {
        logger.error(`Failed to stop job ${name}:`, error);
      }
    }

    logger.info("All background jobs stopped");
  }

  /**
   * Get status of all jobs
   */
  getStatus() {
    const statuses = [];

    for (const job of this.jobs.values()) {
      statuses.push(job.getStatus());
    }

    return statuses;
  }

  /**
   * Get a specific job by name
   */
  getJob(name: string): BaseJob | undefined {
    return this.jobs.get(name);
  }
}

// Global job manager instance
export const jobManager = new JobManager();
