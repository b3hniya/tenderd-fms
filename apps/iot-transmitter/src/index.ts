import chalk from 'chalk';
import { config } from './config/config.js';
import { ScenarioRunner } from './scenarios/ScenarioRunner.js';
import { startStatusDisplay } from './utils/status-display.js';
import logger from './utils/logger.js';

/**
 * Display startup banner
 */
function displayBanner(): void {
  console.clear();
  console.log();
  console.log(
    chalk.cyan.bold(
      '╔════════════════════════════════════════════════════════════════════════════╗',
    ),
  );
  console.log(
    chalk.cyan.bold(
      '║                                                                            ║',
    ),
  );
  console.log(
    chalk.cyan.bold(
      '║                     🚗 TENDERD FMS IoT TRANSMITTER 🚗                     ║',
    ),
  );
  console.log(
    chalk.cyan.bold(
      '║                                                                            ║',
    ),
  );
  console.log(
    chalk.cyan.bold(
      '║                        Fleet Vehicle Simulator                             ║',
    ),
  );
  console.log(
    chalk.cyan.bold(
      '║                                                                            ║',
    ),
  );
  console.log(
    chalk.cyan.bold(
      '╚════════════════════════════════════════════════════════════════════════════╝',
    ),
  );
  console.log();
}

/**
 * Display scenario information
 */
function displayScenarioInfo(): void {
  const scenario = config.scenarioConfig;

  console.log(chalk.yellow('📋 SCENARIO CONFIGURATION'));
  console.log(
    chalk.gray('──────────────────────────────────────────────────────────────────────────────'),
  );
  console.log(`  ${chalk.white('Name:')}              ${chalk.cyan.bold(scenario.name)}`);
  console.log(`  ${chalk.white('Vehicles:')}          ${chalk.cyan.bold(scenario.vehicles)}`);
  console.log(
    `  ${chalk.white('Transmit Interval:')} ${chalk.cyan.bold(scenario.transmitInterval / 1000)}s`,
  );

  if (scenario.offlineProbability !== undefined) {
    console.log(
      `  ${chalk.white('Offline Prob:')}      ${chalk.cyan.bold((scenario.offlineProbability * 100).toFixed(0))}%`,
    );
  }

  if (scenario.offlineAt !== undefined && scenario.offlineDuration !== undefined) {
    console.log(
      `  ${chalk.white('Offline Event:')}     After ${chalk.cyan.bold(scenario.offlineAt / 1000)}s for ${chalk.cyan.bold(scenario.offlineDuration / 1000)}s`,
    );
  }

  if (scenario.corruptionRate !== undefined && scenario.corruptionRate > 0) {
    console.log(
      `  ${chalk.white('Corruption Rate:')}   ${chalk.cyan.bold((scenario.corruptionRate * 100).toFixed(0))}%`,
    );
    if (scenario.corruptionTypes && scenario.corruptionTypes.length > 0) {
      console.log(
        `  ${chalk.white('Corruption Types:')}  ${chalk.cyan.bold(scenario.corruptionTypes.join(', '))}`,
      );
    }
  }

  console.log(
    chalk.gray('──────────────────────────────────────────────────────────────────────────────'),
  );
  console.log();

  console.log(chalk.yellow('🔧 SYSTEM CONFIGURATION'));
  console.log(
    chalk.gray('──────────────────────────────────────────────────────────────────────────────'),
  );
  console.log(`  ${chalk.white('API URL:')}           ${chalk.cyan.bold(config.apiBaseUrl)}`);
  console.log(
    `  ${chalk.white('Log Level:')}         ${chalk.cyan.bold(config.logLevel.toUpperCase())}`,
  );
  console.log(`  ${chalk.white('Max Buffer Size:')}   ${chalk.cyan.bold(config.maxBufferSize)}`);
  console.log(
    chalk.gray('──────────────────────────────────────────────────────────────────────────────'),
  );
  console.log();
}

/**
 * Main application entry point
 */
async function main(): Promise<void> {
  let runner: ScenarioRunner | null = null;
  let stopDisplay: (() => void) | null = null;

  try {
    displayBanner();

    logger.info('🚀 Starting IoT Transmitter', {
      scenario: config.scenario,
      apiBaseUrl: config.apiBaseUrl,
    });

    displayScenarioInfo();

    console.log(chalk.green('▶️  Initializing scenario runner...'));

    runner = new ScenarioRunner(config.scenarioConfig, config.apiBaseUrl);

    console.log(chalk.green('▶️  Creating vehicle simulators...'));
    runner.initialize();

    console.log(chalk.green('▶️  Starting simulation...'));
    runner.start();

    console.log(chalk.green('✅ Simulation started successfully!'));
    console.log();
    console.log(chalk.gray('Starting status display in 2 seconds...'));

    await new Promise(resolve => setTimeout(resolve, 2000));

    stopDisplay = startStatusDisplay(() => runner!.getSimulators(), 1000);

    logger.info('✅ IoT Transmitter running', {
      vehicles: config.scenarioConfig.vehicles,
    });
  } catch (error) {
    console.log();
    console.log(chalk.red.bold('❌ ERROR'));
    console.log(
      chalk.red('──────────────────────────────────────────────────────────────────────────────'),
    );

    if (error instanceof Error) {
      console.log(chalk.red(`  ${error.message}`));
      logger.error('Failed to start IoT Transmitter', {
        error: error.message,
        stack: error.stack,
      });
    } else {
      console.log(chalk.red(`  ${String(error)}`));
      logger.error('Failed to start IoT Transmitter', { error: String(error) });
    }

    console.log(
      chalk.red('──────────────────────────────────────────────────────────────────────────────'),
    );
    console.log();
    console.log(chalk.yellow('💡 TROUBLESHOOTING'));
    console.log(
      chalk.gray('  1. Make sure the API server is running: pnpm --filter @tenderd-fms/api dev'),
    );
    console.log(chalk.gray('  2. Check your .env configuration (API_BASE_URL, SCENARIO)'));
    console.log(chalk.gray('  3. Verify MongoDB is running'));
    console.log();

    process.exit(1);
  }

  /**
   * Graceful shutdown handler
   */
  async function shutdown(signal: string): Promise<void> {
    console.log();
    console.log();
    logger.info(`Received ${signal} - shutting down gracefully...`);

    console.log(chalk.yellow('⏹️  Stopping status display...'));
    if (stopDisplay) {
      stopDisplay();
    }

    console.log(chalk.yellow('⏹️  Stopping all simulators...'));
    if (runner) {
      await runner.stop();
    }

    console.log();
    console.log(chalk.green('✅ Shutdown complete'));
    console.log(chalk.gray('Thank you for using Tenderd FMS IoT Transmitter!'));
    console.log();

    logger.info('IoT Transmitter stopped');

    process.exit(0);
  }

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  process.on('uncaughtException', error => {
    logger.error('Uncaught exception', {
      error: error.message,
      stack: error.stack,
    });
    shutdown('UNCAUGHT_EXCEPTION');
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled rejection', {
      reason: String(reason),
      promise: String(promise),
    });
  });
}

main();
