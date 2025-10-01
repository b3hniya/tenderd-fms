import { Telemetry } from '../../entity';
import { PaginatedResponse } from '../../shared';

export interface SaveTelemetryResponse extends Telemetry {}

export interface SaveTelemetryBatchResponse {
  success: boolean;
  saved: number;
  failed: number;
  errors?: string[];
}

export interface GetTelemetryHistoryResponse extends PaginatedResponse<Telemetry> {}
