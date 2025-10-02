/**
 * Tenderd FMS API Client
 * Auto-generated from Swagger/OpenAPI specification
 *
 * Usage:
 * ```typescript
 * import { OpenAPI, TelemetryService, VehicleService } from '@tenderd-fms/api-client';
 *
 * // Configure base URL
 * OpenAPI.BASE = 'http://localhost:4000';
 *
 * // Use services
 * await TelemetryService.postApiTelemetry({ ... });
 * ```
 */

export * from './generated';

export { OpenAPI } from './generated/core/OpenAPI';
export type { OpenAPIConfig } from './generated/core/OpenAPI';
export { ApiError } from './generated/core/ApiError';
export { CancelablePromise, CancelError } from './generated/core/CancelablePromise';

export { TelemetryService } from './generated/services/TelemetryService';
export { VehicleService } from './generated/services/VehicleService';
export { MaintenanceService } from './generated/services/MaintenanceService';

export type { Error, Success } from './generated';
