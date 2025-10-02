/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */

import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class VehicleService {
  /**
   * Create a new vehicle
   * Creates a new vehicle in the fleet management system
   * @param requestBody
   * @returns any Vehicle created successfully
   * @throws ApiError
   */
  public static postApiVehicle(requestBody: {
    /**
     * Vehicle Identification Number (17 characters)
     */
    vin: string;
    licensePlate: string;
    vehicleModel: string;
    manufacturer: string;
    year: number;
    type: 'SEDAN' | 'SUV' | 'TRUCK' | 'VAN' | 'BUS' | 'MOTORCYCLE' | 'OTHER';
    fuelType: 'GASOLINE' | 'DIESEL' | 'ELECTRIC' | 'HYBRID' | 'CNG' | 'LPG' | 'OTHER';
    status?: 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE' | 'OUT_OF_SERVICE';
  }): CancelablePromise<any> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/api/vehicle',
      body: requestBody,
      mediaType: 'application/json',
      errors: {
        400: `Validation error`,
        500: `Internal server error`,
      },
    });
  }
  /**
   * Get vehicle(s)
   * Get a specific vehicle by ID, VIN, or get all vehicles with pagination
   * @param id MongoDB ObjectId of the vehicle
   * @param vin Vehicle Identification Number (VIN)
   * @param page Page number for pagination
   * @param limit Number of items per page
   * @param status Filter by vehicle status
   * @param type Filter by vehicle type
   * @returns any Vehicle(s) retrieved successfully
   * @throws ApiError
   */
  public static getApiVehicle(
    id?: string,
    vin?: string,
    page: number = 1,
    limit: number = 10,
    status?: 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE' | 'OUT_OF_SERVICE',
    type?: 'SEDAN' | 'SUV' | 'TRUCK' | 'VAN' | 'BUS' | 'MOTORCYCLE' | 'OTHER',
  ): CancelablePromise<any> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/api/vehicle',
      query: {
        id: id,
        vin: vin,
        page: page,
        limit: limit,
        status: status,
        type: type,
      },
      errors: {
        404: `Vehicle not found`,
        500: `Internal server error`,
      },
    });
  }
}
