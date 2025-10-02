/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */

import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class MaintenanceService {
  /**
   * Create a new maintenance record
   * @param requestBody
   * @returns any Maintenance record created successfully
   * @throws ApiError
   */
  public static postApiMaintenance(requestBody: {
    /**
     * ID of the vehicle
     */
    vehicleId: string;
    type: 'SCHEDULED' | 'REPAIR' | 'INSPECTION' | 'EMERGENCY';
    title: string;
    description?: string;
    scheduledAt?: string;
    mechanicId?: string;
    mechanicName?: string;
    odometerReading?: number;
    notes?: string;
  }): CancelablePromise<any> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/api/maintenance',
      body: requestBody,
      mediaType: 'application/json',
      errors: {
        400: `Invalid request data`,
        404: `Vehicle not found`,
      },
    });
  }
  /**
   * Update maintenance record
   * @param requestBody
   * @returns any Maintenance record updated successfully
   * @throws ApiError
   */
  public static patchApiMaintenance(requestBody: {
    /**
     * Maintenance record ID
     */
    id: string;
    status?: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    parts?: Array<{
      name?: string;
      quantity?: number;
      cost?: number;
    }>;
    laborCost?: number;
    startedAt?: string;
    completedAt?: string;
    mechanicId?: string;
    mechanicName?: string;
    notes?: string;
  }): CancelablePromise<any> {
    return __request(OpenAPI, {
      method: 'PATCH',
      url: '/api/maintenance',
      body: requestBody,
      mediaType: 'application/json',
      errors: {
        400: `Invalid request data`,
        404: `Maintenance record not found`,
      },
    });
  }
  /**
   * Get maintenance record by ID
   * @param id Maintenance record ID
   * @returns any Maintenance record retrieved successfully
   * @throws ApiError
   */
  public static getApiMaintenance(id: string): CancelablePromise<any> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/api/maintenance',
      query: {
        id: id,
      },
      errors: {
        404: `Maintenance record not found`,
      },
    });
  }
  /**
   * Get maintenance history for a vehicle
   * @param vehicleId Vehicle ID
   * @param status Filter by status
   * @param startDate Filter by start date
   * @param endDate Filter by end date
   * @param page
   * @param limit
   * @returns any Maintenance history retrieved successfully
   * @throws ApiError
   */
  public static getApiMaintenanceVehicle(
    vehicleId: string,
    status?: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED',
    startDate?: string,
    endDate?: string,
    page: number = 1,
    limit: number = 10,
  ): CancelablePromise<any> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/api/maintenance/vehicle',
      query: {
        vehicleId: vehicleId,
        status: status,
        startDate: startDate,
        endDate: endDate,
        page: page,
        limit: limit,
      },
      errors: {
        400: `Invalid request parameters`,
      },
    });
  }
}
