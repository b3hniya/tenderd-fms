module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/__tests__/**/*.test.ts", "**/?(*.)+(spec|test).ts"],
  transform: {
    "^.+\\.ts$": ["ts-jest", {
      useESM: false,
    }],
  },
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/**/__tests__/**",
  ],
  moduleNameMapper: {
    "^@tenderd-fms/core-types$": "<rootDir>/../../libs/core-types/src",
    "^../../../infrastructure/configs/logger$": "<rootDir>/src/__tests__/mocks/logger.ts",
    "^../../../../infrastructure/configs/logger$": "<rootDir>/src/__tests__/mocks/logger.ts",
  },
  setupFilesAfterEnv: ["<rootDir>/src/__tests__/setup.ts"],
  testTimeout: 30000,
  transformIgnorePatterns: [
    "node_modules/(?!(chalk|winston|@so-ric)/)",
  ],
  extensionsToTreatAsEsm: [],
  globals: {
    "ts-jest": {
      isolatedModules: true,
    },
  },
};

