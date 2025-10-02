/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */

import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class TelemetryService {
  /**
   * Save batch of telemetry data for a vehicle
   * Saves multiple telemetry records (e.g., from offline buffer)
   * @param requestBody
   * @returns any Batch saved successfully
   * @throws ApiError
   */
  public static postApiTelemetryBatch(requestBody: {
    vehicleId: string;
    telemetryData: Array<{
      location: {
        lat?: number;
        lng?: number;
      };
      speed: number;
      fuelLevel: number;
      odometer: number;
      engineTemp: number;
      engineRPM?: number;
      timestamp: string;
    }>;
    deviceId?: string;
  }): CancelablePromise<any> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/api/telemetry/batch',
      body: requestBody,
      mediaType: 'application/json',
      errors: {
        400: `Validation error`,
        404: `Vehicle not found`,
        500: `Internal server error`,
      },
    });
  }
  /**
   * Get telemetry history for a vehicle
   * Retrieves historical telemetry data with optional date range
   * @param vehicleId MongoDB ObjectId of the vehicle
   * @param startDate Start date for filtering
   * @param endDate End date for filtering
   * @param page Page number for pagination
   * @param limit Number of items per page (max 500)
   * @returns any Telemetry history retrieved successfully
   * @throws ApiError
   */
  public static getApiTelemetryHistory(
    vehicleId: string,
    startDate?: string,
    endDate?: string,
    page: number = 1,
    limit: number = 100,
  ): CancelablePromise<any> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/api/telemetry/history',
      query: {
        vehicleId: vehicleId,
        startDate: startDate,
        endDate: endDate,
        page: page,
        limit: limit,
      },
      errors: {
        400: `Validation error`,
        500: `Internal server error`,
      },
    });
  }
  /**
   * Save telemetry data for a vehicle
   * Saves a single telemetry record with contextual validation
   * @param requestBody
   * @returns any Telemetry saved successfully
   * @throws ApiError
   */
  public static postApiTelemetry(requestBody: {
    vehicleId: string;
    location: {
      lat: number;
      lng: number;
    };
    speed: number;
    fuelLevel: number;
    odometer: number;
    engineTemp: number;
    engineRPM?: number;
    timestamp?: string;
    deviceId?: string;
  }): CancelablePromise<any> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/api/telemetry',
      body: requestBody,
      mediaType: 'application/json',
      errors: {
        400: `Validation error`,
        404: `Vehicle not found`,
        500: `Internal server error`,
      },
    });
  }
}
