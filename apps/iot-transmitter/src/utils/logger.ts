import winston from 'winston';
import chalk from 'chalk';
import { config } from '../config/config.js';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

const { combine, timestamp, printf, errors } = winston.format;

/**
 * Custom log format with colors
 */
const coloredFormat = printf(({ level, message, timestamp, ...meta }) => {
  const ts = chalk.gray(timestamp);
  let levelColor = chalk.white;

  switch (level) {
    case 'error':
      levelColor = chalk.red;
      break;
    case 'warn':
      levelColor = chalk.yellow;
      break;
    case 'info':
      levelColor = chalk.blue;
      break;
    case 'debug':
      levelColor = chalk.magenta;
      break;
  }

  const levelStr = levelColor(level.toUpperCase().padEnd(5));
  const metaStr = Object.keys(meta).length ? chalk.gray(JSON.stringify(meta)) : '';

  return `${ts} ${levelStr} ${message} ${metaStr}`;
});

/**
 * File log format (no colors)
 */
const fileFormat = printf(({ level, message, timestamp, ...meta }) => {
  const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
  return `${timestamp} ${level.toUpperCase().padEnd(5)} ${message} ${metaStr}`;
});

/**
 * Create Winston logger instance
 */
function createLogger() {
  const transports: winston.transport[] = [
    new winston.transports.Console({
      format: combine(timestamp({ format: 'HH:mm:ss' }), errors({ stack: true }), coloredFormat),
    }),
  ];

  if (config.logToFile) {
    const logsDir = join(process.cwd(), 'logs');

    if (!existsSync(logsDir)) {
      mkdirSync(logsDir, { recursive: true });
    }

    transports.push(
      new winston.transports.File({
        filename: join(logsDir, 'iot-transmitter.log'),
        format: combine(
          timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
          errors({ stack: true }),
          fileFormat,
        ),
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      }),
    );

    transports.push(
      new winston.transports.File({
        filename: join(logsDir, 'error.log'),
        level: 'error',
        format: combine(
          timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
          errors({ stack: true }),
          fileFormat,
        ),
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      }),
    );
  }

  return winston.createLogger({
    level: config.logLevel,
    transports,
    exitOnError: false,
  });
}

export const logger = createLogger();

export default logger;
