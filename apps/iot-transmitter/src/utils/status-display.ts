import chalk from 'chalk';
import type { VehicleSimulator } from '../services/VehicleSimulator.js';
import { ConnectionStatus } from '../services/VehicleSimulator.js';

/**
 * Clear the console screen
 */
export function clearScreen(): void {
  console.clear();
}

/**
 * Get colored status indicator based on connection status
 */
function getStatusIndicator(status: ConnectionStatus): string {
  switch (status) {
    case ConnectionStatus.ONLINE:
      return chalk.green('🟢 ONLINE');
    case ConnectionStatus.OFFLINE:
      return chalk.red('🔴 OFFLINE');
    case ConnectionStatus.FLUSHING:
      return chalk.yellow('🟡 FLUSHING');
    default:
      return chalk.gray('⚪ UNKNOWN');
  }
}

/**
 * Format a number with fixed decimal places
 */
function formatNumber(value: number, decimals: number = 1): string {
  return value.toFixed(decimals);
}

/**
 * Truncate string to max length with ellipsis
 */
function truncate(str: string, maxLength: number): string {
  return str.length > maxLength ? str.substring(0, maxLength - 3) + '...' : str.padEnd(maxLength);
}

/**
 * Display real-time status of all vehicle simulators
 */
export function displayStatus(simulators: VehicleSimulator[]): void {
  if (simulators.length === 0) {
    console.log(chalk.yellow('⚠️  No simulators running'));
    return;
  }

  const statuses = simulators.map(sim => sim.getStatus());

  const onlineCount = statuses.filter(s => s.connectionStatus === ConnectionStatus.ONLINE).length;
  const offlineCount = statuses.filter(s => s.connectionStatus === ConnectionStatus.OFFLINE).length;
  const flushingCount = statuses.filter(
    s => s.connectionStatus === ConnectionStatus.FLUSHING,
  ).length;
  const totalBuffered = statuses.reduce((sum, s) => sum + s.buffer.size, 0);
  const averageSpeed = statuses.reduce((sum, s) => sum + s.speed, 0) / statuses.length;

  console.log(
    chalk.blue.bold('═══════════════════════════════════════════════════════════════════════════'),
  );
  console.log(
    chalk.blue.bold('                        🚗 FLEET SIMULATOR STATUS                           '),
  );
  console.log(
    chalk.blue.bold('═══════════════════════════════════════════════════════════════════════════'),
  );
  console.log();

  console.log(chalk.cyan('📊 FLEET SUMMARY'));
  console.log(
    chalk.gray('─────────────────────────────────────────────────────────────────────────────'),
  );
  console.log(
    `  Total Vehicles: ${chalk.white.bold(statuses.length)}  |  ` +
      `${chalk.green('Online')}: ${chalk.white.bold(onlineCount)}  |  ` +
      `${chalk.red('Offline')}: ${chalk.white.bold(offlineCount)}  |  ` +
      `${chalk.yellow('Flushing')}: ${chalk.white.bold(flushingCount)}`,
  );
  console.log(
    `  Total Buffered: ${chalk.white.bold(totalBuffered)}  |  ` +
      `Avg Speed: ${chalk.white.bold(formatNumber(averageSpeed, 1))} km/h`,
  );
  console.log();

  console.log(chalk.cyan('🚙 VEHICLE STATUS'));
  console.log(
    chalk.gray('─────────────────────────────────────────────────────────────────────────────'),
  );

  const header =
    chalk.white.bold('  VEHICLE ID'.padEnd(28)) +
    chalk.white.bold('STATUS'.padEnd(18)) +
    chalk.white.bold('SPEED'.padEnd(12)) +
    chalk.white.bold('FUEL'.padEnd(10)) +
    chalk.white.bold('BUFFER'.padEnd(12)) +
    chalk.white.bold('LOCATION');
  console.log(header);
  console.log(
    chalk.gray('─────────────────────────────────────────────────────────────────────────────'),
  );

  statuses.forEach(status => {
    const vehicleId = truncate(status.vehicleId, 24);
    const statusIndicator = getStatusIndicator(status.connectionStatus);
    const speed = chalk.white(`${formatNumber(status.speed, 1)} km/h`.padEnd(10));
    const fuel = chalk.white(`${formatNumber(status.fuelLevel, 1)}%`.padEnd(8));

    let bufferDisplay = '';
    if (status.buffer.size > 0) {
      const utilization = status.buffer.utilization.toFixed(0);
      if (status.buffer.isFull) {
        bufferDisplay = chalk.red.bold(`${status.buffer.size} (${utilization}%)`.padEnd(10));
      } else if (status.buffer.utilization > 80) {
        bufferDisplay = chalk.yellow(`${status.buffer.size} (${utilization}%)`.padEnd(10));
      } else {
        bufferDisplay = chalk.white(`${status.buffer.size} (${utilization}%)`.padEnd(10));
      }
    } else {
      bufferDisplay = chalk.gray('—'.padEnd(10));
    }

    const location = chalk.gray(
      `${status.position.lat.toFixed(4)}, ${status.position.lng.toFixed(4)}`,
    );

    console.log(
      `  ${vehicleId}  ${statusIndicator}  ${speed}  ${fuel}  ${bufferDisplay}  ${location}`,
    );
  });

  console.log(
    chalk.gray('─────────────────────────────────────────────────────────────────────────────'),
  );
  console.log();

  console.log(chalk.gray(`Updated: ${new Date().toLocaleTimeString()}`));
  console.log(chalk.gray('Press Ctrl+C to stop'));
  console.log();
}

/**
 * Display status with auto-refresh
 * Returns a function to stop the refresh
 */
export function startStatusDisplay(
  getSimulators: () => VehicleSimulator[],
  intervalMs: number = 1000,
): () => void {
  const refresh = () => {
    clearScreen();
    displayStatus(getSimulators());
  };

  refresh();
  const interval = setInterval(refresh, intervalMs);

  return () => {
    clearInterval(interval);
  };
}
