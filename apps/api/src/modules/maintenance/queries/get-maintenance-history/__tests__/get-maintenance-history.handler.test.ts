import { GetMaintenanceHistoryHandler } from "../get-maintenance-history.handler";
import { GetMaintenanceHistoryQuery } from "../get-maintenance-history.query";
import { Maintenance } from "../../../models/maintenance";
import { Vehicle } from "../../../../vehicle/models/vehicle";
import { VehicleType, VehicleStatus, FuelType, MaintenanceType, MaintenanceStatus } from "@tenderd-fms/core-types";

describe("GetMaintenanceHistoryHandler", () => {
  let handler: GetMaintenanceHistoryHandler;
  let vehicleId: string;
  let vehicle2Id: string;

  beforeEach(async () => {
    handler = new GetMaintenanceHistoryHandler();

    const vehicle = await Vehicle.create({
      vin: "1HGBH41JXMN109186",
      licensePlate: "ABC-1234",
      vehicleModel: "Model S",
      manufacturer: "Tesla",
      year: 2024,
      type: VehicleType.SEDAN,
      fuelType: FuelType.ELECTRIC,
      status: VehicleStatus.ACTIVE,
      connectionStatus: "OFFLINE",
      lastSeenAt: new Date(),
    });

    vehicleId = (vehicle._id as any).toString();

    const vehicle2 = await Vehicle.create({
      vin: "2HGBH41JXMN109187",
      licensePlate: "XYZ-9999",
      vehicleModel: "Model 3",
      manufacturer: "Tesla",
      year: 2024,
      type: VehicleType.SEDAN,
      fuelType: FuelType.ELECTRIC,
      status: VehicleStatus.ACTIVE,
      connectionStatus: "OFFLINE",
      lastSeenAt: new Date(),
    });

    vehicle2Id = (vehicle2._id as any).toString();

    await Maintenance.create([
      {
        vehicleId,
        type: MaintenanceType.REPAIR,
        status: MaintenanceStatus.COMPLETED,
        title: "Oil change 1",
        createdAt: new Date("2025-01-01T10:00:00Z"),
      },
      {
        vehicleId,
        type: MaintenanceType.INSPECTION,
        status: MaintenanceStatus.COMPLETED,
        title: "Safety inspection",
        createdAt: new Date("2025-01-15T10:00:00Z"),
      },
      {
        vehicleId,
        type: MaintenanceType.REPAIR,
        status: MaintenanceStatus.SCHEDULED,
        title: "Brake service",
        scheduledAt: new Date("2025-02-01T10:00:00Z"),
        createdAt: new Date("2025-01-20T10:00:00Z"),
      },
      {
        vehicleId,
        type: MaintenanceType.REPAIR,
        status: MaintenanceStatus.IN_PROGRESS,
        title: "Tire rotation",
        startedAt: new Date("2025-01-25T10:00:00Z"),
        createdAt: new Date("2025-01-25T10:00:00Z"),
      },
      {
        vehicleId,
        type: MaintenanceType.EMERGENCY,
        status: MaintenanceStatus.CANCELLED,
        title: "Emergency repair",
        createdAt: new Date("2025-01-30T10:00:00Z"),
      },
      // Record for different vehicle
      {
        vehicleId: vehicle2Id,
        type: MaintenanceType.REPAIR,
        status: MaintenanceStatus.COMPLETED,
        title: "Oil change for vehicle 2",
        createdAt: new Date("2025-01-10T10:00:00Z"),
      },
    ]);
  });

  describe("execute", () => {
    it("should fetch all maintenance records for a vehicle", async () => {
      // Arrange
      const query = new GetMaintenanceHistoryQuery(vehicleId);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result.data).toBeDefined();
      expect(result.data).toHaveLength(5);
      expect(result.pagination.total).toBe(5);
    });

    it("should return records sorted by createdAt descending (newest first)", async () => {
      // Arrange
      const query = new GetMaintenanceHistoryQuery(vehicleId);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result.data[0].title).toBe("Emergency repair"); // 2025-01-30
      expect(result.data[1].title).toBe("Tire rotation"); // 2025-01-25
      expect(result.data[2].title).toBe("Brake service"); // 2025-01-20
      expect(result.data[3].title).toBe("Safety inspection"); // 2025-01-15
      expect(result.data[4].title).toBe("Oil change 1"); // 2025-01-01
    });

    it("should include pagination metadata", async () => {
      // Arrange
      const query = new GetMaintenanceHistoryQuery(vehicleId, undefined, undefined, undefined, 1, 10);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result.pagination).toBeDefined();
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);
      expect(result.pagination.total).toBe(5);
      expect(result.pagination.totalPages).toBe(1);
    });

    it("should filter by status", async () => {
      // Arrange
      const query = new GetMaintenanceHistoryQuery(vehicleId, MaintenanceStatus.COMPLETED);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result.data).toHaveLength(2);
      expect(result.data.every((m: any) => m.status === MaintenanceStatus.COMPLETED)).toBe(true);
      expect(result.pagination.total).toBe(2);
    });

    it("should filter by SCHEDULED status", async () => {
      // Arrange
      const query = new GetMaintenanceHistoryQuery(vehicleId, MaintenanceStatus.SCHEDULED);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.data[0].status).toBe(MaintenanceStatus.SCHEDULED);
      expect(result.data[0].title).toBe("Brake service");
    });

    it("should filter by IN_PROGRESS status", async () => {
      // Arrange
      const query = new GetMaintenanceHistoryQuery(vehicleId, MaintenanceStatus.IN_PROGRESS);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.data[0].status).toBe(MaintenanceStatus.IN_PROGRESS);
      expect(result.data[0].title).toBe("Tire rotation");
    });

    it("should filter by CANCELLED status", async () => {
      // Arrange
      const query = new GetMaintenanceHistoryQuery(vehicleId, MaintenanceStatus.CANCELLED);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.data[0].status).toBe(MaintenanceStatus.CANCELLED);
      expect(result.data[0].title).toBe("Emergency repair");
    });

    it("should filter by start date", async () => {
      // Arrange
      const startDate = new Date("2025-01-20T00:00:00Z");
      const query = new GetMaintenanceHistoryQuery(vehicleId, undefined, startDate);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result.data).toHaveLength(3); // Brake service, Tire rotation, Emergency repair
      expect(result.data.every((m: any) => new Date(m.createdAt) >= startDate)).toBe(true);
    });

    it("should filter by end date", async () => {
      // Arrange
      const endDate = new Date("2025-01-15T23:59:59Z");
      const query = new GetMaintenanceHistoryQuery(vehicleId, undefined, undefined, endDate);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result.data).toHaveLength(2); // Oil change 1, Safety inspection
      expect(result.data.every((m: any) => new Date(m.createdAt) <= endDate)).toBe(true);
    });

    it("should filter by date range", async () => {
      // Arrange
      const startDate = new Date("2025-01-10T00:00:00Z");
      const endDate = new Date("2025-01-25T23:59:59Z");
      const query = new GetMaintenanceHistoryQuery(vehicleId, undefined, startDate, endDate);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result.data).toHaveLength(3); // Safety inspection, Brake service, Tire rotation
      expect(
        result.data.every((m: any) => {
          const date = new Date(m.createdAt);
          return date >= startDate && date <= endDate;
        })
      ).toBe(true);
    });

    it("should combine status and date filters", async () => {
      // Arrange
      const startDate = new Date("2025-01-10T00:00:00Z");
      const query = new GetMaintenanceHistoryQuery(vehicleId, MaintenanceStatus.COMPLETED, startDate);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.data[0].status).toBe(MaintenanceStatus.COMPLETED);
      expect(result.data[0].title).toBe("Safety inspection");
    });

    it("should support pagination - first page", async () => {
      // Arrange
      const query = new GetMaintenanceHistoryQuery(vehicleId, undefined, undefined, undefined, 1, 2);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result.data).toHaveLength(2);
      expect(result.data[0].title).toBe("Emergency repair");
      expect(result.data[1].title).toBe("Tire rotation");
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(2);
      expect(result.pagination.total).toBe(5);
      expect(result.pagination.totalPages).toBe(3);
    });

    it("should support pagination - second page", async () => {
      // Arrange
      const query = new GetMaintenanceHistoryQuery(vehicleId, undefined, undefined, undefined, 2, 2);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result.data).toHaveLength(2);
      expect(result.data[0].title).toBe("Brake service");
      expect(result.data[1].title).toBe("Safety inspection");
      expect(result.pagination.page).toBe(2);
    });

    it("should support pagination - last page", async () => {
      // Arrange
      const query = new GetMaintenanceHistoryQuery(vehicleId, undefined, undefined, undefined, 3, 2);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.data[0].title).toBe("Oil change 1");
      expect(result.pagination.page).toBe(3);
      expect(result.pagination.totalPages).toBe(3);
    });

    it("should return empty array for vehicle with no maintenance", async () => {
      // Arrange
      const newVehicle = await Vehicle.create({
        vin: "3HGBH41JXMN109188",
        licensePlate: "NEW-1111",
        vehicleModel: "Model X",
        manufacturer: "Tesla",
        year: 2024,
        type: VehicleType.SUV,
        fuelType: FuelType.ELECTRIC,
        status: VehicleStatus.ACTIVE,
        connectionStatus: "OFFLINE",
        lastSeenAt: new Date(),
      });
      const newVehicleId = (newVehicle._id as any).toString();
      const query = new GetMaintenanceHistoryQuery(newVehicleId);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result.data).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
      expect(result.pagination.totalPages).toBe(0);
    });

    it("should return empty array when filtering yields no results", async () => {
      // Arrange
      const startDate = new Date("2026-01-01T00:00:00Z"); // Future date
      const query = new GetMaintenanceHistoryQuery(vehicleId, undefined, startDate);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result.data).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
    });

    it("should only return records for specified vehicle", async () => {
      // Arrange
      const query = new GetMaintenanceHistoryQuery(vehicleId);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result.data).toHaveLength(5);
      expect(result.data.every((m: any) => m.vehicleId === vehicleId)).toBe(true);
      expect(result.data.some((m: any) => m.title === "Oil change for vehicle 2")).toBe(false);
    });

    it("should return different records for different vehicles", async () => {
      // Arrange
      const query1 = new GetMaintenanceHistoryQuery(vehicleId);
      const query2 = new GetMaintenanceHistoryQuery(vehicle2Id);

      // Act
      const result1 = await handler.execute(query1);
      const result2 = await handler.execute(query2);

      // Assert
      expect(result1.data).toHaveLength(5);
      expect(result2.data).toHaveLength(1);
      expect(result2.data[0].title).toBe("Oil change for vehicle 2");
    });

    it("should use default pagination values", async () => {
      // Arrange
      const query = new GetMaintenanceHistoryQuery(vehicleId);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);
    });

    it("should handle custom page size", async () => {
      // Arrange
      const query = new GetMaintenanceHistoryQuery(vehicleId, undefined, undefined, undefined, 1, 3);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result.data).toHaveLength(3);
      expect(result.pagination.limit).toBe(3);
      expect(result.pagination.totalPages).toBe(2);
    });

    it("should return empty page for out of range page number", async () => {
      // Arrange
      const query = new GetMaintenanceHistoryQuery(vehicleId, undefined, undefined, undefined, 10, 10);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result.data).toHaveLength(0);
      expect(result.pagination.page).toBe(10);
      expect(result.pagination.total).toBe(5);
    });

    it("should return all fields for each maintenance record", async () => {
      // Arrange
      const query = new GetMaintenanceHistoryQuery(vehicleId, undefined, undefined, undefined, 1, 1);

      // Act
      const result = await handler.execute(query);

      // Assert
      const record = result.data[0];
      expect(record._id).toBeDefined();
      expect(record.vehicleId).toBeDefined();
      expect(record.type).toBeDefined();
      expect(record.status).toBeDefined();
      expect(record.title).toBeDefined();
      expect(record.createdAt).toBeDefined();
      expect(record.updatedAt).toBeDefined();
    });

    it("should return lean objects (not Mongoose documents)", async () => {
      // Arrange
      const query = new GetMaintenanceHistoryQuery(vehicleId);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result.data[0].constructor.name).toBe("Object");
      expect(typeof result.data[0].save).toBe("undefined");
    });

    it("should calculate totalPages correctly", async () => {
      // Arrange
      const query1 = new GetMaintenanceHistoryQuery(vehicleId, undefined, undefined, undefined, 1, 2);
      const query2 = new GetMaintenanceHistoryQuery(vehicleId, undefined, undefined, undefined, 1, 3);
      const query3 = new GetMaintenanceHistoryQuery(vehicleId, undefined, undefined, undefined, 1, 5);

      // Act
      const result1 = await handler.execute(query1);
      const result2 = await handler.execute(query2);
      const result3 = await handler.execute(query3);

      // Assert
      expect(result1.pagination.totalPages).toBe(3);
      expect(result2.pagination.totalPages).toBe(2);
      expect(result3.pagination.totalPages).toBe(1);
    });

    it("should handle exact date match", async () => {
      // Arrange
      const exactDate = new Date("2025-01-15T10:00:00Z");
      const query = new GetMaintenanceHistoryQuery(vehicleId, undefined, exactDate, exactDate);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.data[0].title).toBe("Safety inspection");
    });

    it("should handle large page size", async () => {
      // Arrange
      const query = new GetMaintenanceHistoryQuery(vehicleId, undefined, undefined, undefined, 1, 100);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result.data).toHaveLength(5);
      expect(result.pagination.limit).toBe(100);
      expect(result.pagination.totalPages).toBe(1);
    });

    it("should return consistent results for same query", async () => {
      // Arrange
      const query = new GetMaintenanceHistoryQuery(vehicleId, MaintenanceStatus.COMPLETED);

      // Act
      const result1 = await handler.execute(query);
      const result2 = await handler.execute(query);

      // Assert
      expect(result1.data).toHaveLength(result2.data.length);
      expect(result1.pagination.total).toBe(result2.pagination.total);
    });
  });
});
