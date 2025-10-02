import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { AppConfig, ScenariosConfig, ScenarioConfig } from '../types/scenario.types.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..', '..');

/**
 * Load scenarios from JSON file
 */
function loadScenarios(): ScenariosConfig {
  try {
    const scenariosPath = join(rootDir, 'scenarios.json');
    const scenariosContent = readFileSync(scenariosPath, 'utf-8');
    return JSON.parse(scenariosContent) as ScenariosConfig;
  } catch (error) {
    console.error('❌ Failed to load scenarios.json:', error);
    throw new Error('Could not load scenarios configuration');
  }
}

/**
 * Get scenario configuration by name
 */
function getScenarioConfig(scenarioName: string, scenarios: ScenariosConfig): ScenarioConfig {
  const scenario = scenarios[scenarioName];

  if (!scenario) {
    const availableScenarios = Object.keys(scenarios).join(', ');
    throw new Error(
      `Scenario "${scenarioName}" not found. Available scenarios: ${availableScenarios}`,
    );
  }

  return scenario;
}

/**
 * Validate and parse environment variables
 */
function validateEnv() {
  const apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:4000';
  const logLevel = (process.env.LOG_LEVEL || 'info') as 'debug' | 'info' | 'warn' | 'error';
  const logToFile = process.env.LOG_TO_FILE === 'true';
  const transmitInterval = parseInt(process.env.TRANSMIT_INTERVAL || '30000', 10);
  const maxBufferSize = parseInt(process.env.MAX_BUFFER_SIZE || '500', 10);
  const scenario = process.env.SCENARIO || 'normal';

  if (isNaN(transmitInterval) || transmitInterval < 1000) {
    throw new Error('TRANSMIT_INTERVAL must be a number >= 1000 (ms)');
  }

  if (isNaN(maxBufferSize) || maxBufferSize < 1) {
    throw new Error('MAX_BUFFER_SIZE must be a number >= 1');
  }

  const validLogLevels = ['debug', 'info', 'warn', 'error'];
  if (!validLogLevels.includes(logLevel)) {
    throw new Error(`LOG_LEVEL must be one of: ${validLogLevels.join(', ')}`);
  }

  return {
    apiBaseUrl,
    logLevel,
    logToFile,
    transmitInterval,
    maxBufferSize,
    scenario,
  };
}

/**
 * Apply environment variable overrides to scenario config
 */
function applyOverrides(
  scenarioConfig: ScenarioConfig,
  env: ReturnType<typeof validateEnv>,
): ScenarioConfig {
  const overrides: Partial<ScenarioConfig> = {};

  if (process.env.VEHICLES_COUNT) {
    const vehicles = parseInt(process.env.VEHICLES_COUNT, 10);
    if (!isNaN(vehicles) && vehicles > 0) {
      overrides.vehicles = vehicles;
    }
  }

  if (process.env.OFFLINE_PROBABILITY) {
    const probability = parseFloat(process.env.OFFLINE_PROBABILITY);
    if (!isNaN(probability) && probability >= 0 && probability <= 1) {
      overrides.offlineProbability = probability;
    }
  }

  if (process.env.CORRUPTION_RATE) {
    const rate = parseFloat(process.env.CORRUPTION_RATE);
    if (!isNaN(rate) && rate >= 0 && rate <= 1) {
      overrides.corruptionRate = rate;
    }
  }

  return {
    ...scenarioConfig,
    transmitInterval: env.transmitInterval,
    ...overrides,
  };
}

/**
 * Load and build application configuration
 */
function buildConfig(): AppConfig {
  const env = validateEnv();

  const scenarios = loadScenarios();

  const scenarioConfig = getScenarioConfig(env.scenario, scenarios);

  const finalScenarioConfig = applyOverrides(scenarioConfig, env);

  return {
    apiBaseUrl: env.apiBaseUrl,
    logLevel: env.logLevel,
    logToFile: env.logToFile,
    transmitInterval: env.transmitInterval,
    maxBufferSize: env.maxBufferSize,
    scenario: env.scenario,
    scenarioConfig: finalScenarioConfig,
  };
}

export const config = buildConfig();

export { loadScenarios, getScenarioConfig };
