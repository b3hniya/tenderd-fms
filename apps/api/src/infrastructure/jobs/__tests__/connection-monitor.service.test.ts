import { ConnectionMonitorService } from "../connection-monitor.service";
import { Vehicle } from "../../../modules/vehicle/models/vehicle";
import { EventBus } from "../../../__tests__/mocks/event-bus";
import { Container } from "../../event-source/container";
import { ConnectionStatus } from "@tenderd-fms/core-types";

describe("ConnectionMonitorService", () => {
  let connectionMonitor: ConnectionMonitorService;
  let eventBusMock: EventBus;

  beforeEach(async () => {
    eventBusMock = new EventBus();
    jest.spyOn(Container, "resolve").mockReturnValue(eventBusMock);
    connectionMonitor = new ConnectionMonitorService();
  });

  afterEach(async () => {
    jest.restoreAllMocks();
  });

  describe("checkStaleConnections", () => {
    it("should mark vehicle as ONLINE if lastSeenAt is within 60 seconds", async () => {
      const thirtySecondsAgo = new Date(Date.now() - 30 * 1000);
      const vehicle = await Vehicle.create({
        vin: "TEST123456789ONLINE",
        licensePlate: "TEST-001",
        vehicleModel: "Test Model",
        manufacturer: "Test Manufacturer",
        year: 2024,
        type: "SEDAN",
        fuelType: "GASOLINE",
        status: "ACTIVE",
        connectionStatus: ConnectionStatus.STALE,
        lastSeenAt: thirtySecondsAgo,
      });

      await connectionMonitor.checkStaleConnections();

      const updated = await Vehicle.findById(vehicle._id);
      expect(updated?.connectionStatus).toBe(ConnectionStatus.ONLINE);
    });

    it("should mark vehicle as STALE if lastSeenAt is between 60s and 5min", async () => {
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
      const vehicle = await Vehicle.create({
        vin: "TEST123456789STALE",
        licensePlate: "TEST-002",
        vehicleModel: "Test Model",
        manufacturer: "Test Manufacturer",
        year: 2024,
        type: "SEDAN",
        fuelType: "GASOLINE",
        status: "ACTIVE",
        connectionStatus: ConnectionStatus.ONLINE,
        lastSeenAt: twoMinutesAgo,
      });

      await connectionMonitor.checkStaleConnections();

      const updated = await Vehicle.findById(vehicle._id);
      expect(updated?.connectionStatus).toBe(ConnectionStatus.STALE);
    });

    it("should mark vehicle as OFFLINE if lastSeenAt is more than 5 minutes ago", async () => {
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      const vehicle = await Vehicle.create({
        vin: "TEST123456789OFFLNE",
        licensePlate: "TEST-003",
        vehicleModel: "Test Model",
        manufacturer: "Test Manufacturer",
        year: 2024,
        type: "SEDAN",
        fuelType: "GASOLINE",
        status: "ACTIVE",
        connectionStatus: ConnectionStatus.STALE,
        lastSeenAt: tenMinutesAgo,
      });

      await connectionMonitor.checkStaleConnections();

      const updated = await Vehicle.findById(vehicle._id);
      expect(updated?.connectionStatus).toBe(ConnectionStatus.OFFLINE);
    });

    it("should publish VehicleOfflineEvent when vehicle goes offline", async () => {
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      await Vehicle.create({
        vin: "TEST123456789EVENT",
        licensePlate: "TEST-004",
        vehicleModel: "Test Model",
        manufacturer: "Test Manufacturer",
        year: 2024,
        type: "SEDAN",
        fuelType: "GASOLINE",
        status: "ACTIVE",
        connectionStatus: ConnectionStatus.ONLINE,
        lastSeenAt: tenMinutesAgo,
      });

      await connectionMonitor.checkStaleConnections();

      expect(eventBusMock.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          vin: "TEST123456789EVENT",
          previousStatus: ConnectionStatus.ONLINE,
        })
      );
    });

    it("should publish VehicleReconnectedEvent when vehicle reconnects from offline", async () => {
      const thirtySecondsAgo = new Date(Date.now() - 30 * 1000);
      await Vehicle.create({
        vin: "TEST123RECONNECT",
        licensePlate: "TEST-005",
        vehicleModel: "Test Model",
        manufacturer: "Test Manufacturer",
        year: 2024,
        type: "SEDAN",
        fuelType: "GASOLINE",
        status: "ACTIVE",
        connectionStatus: ConnectionStatus.OFFLINE,
        lastSeenAt: thirtySecondsAgo,
      });

      await connectionMonitor.checkStaleConnections();

      expect(eventBusMock.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          vin: "TEST123RECONNECT",
        })
      );
    });

    it("should not update status if it has not changed", async () => {
      const thirtySecondsAgo = new Date(Date.now() - 30 * 1000);
      const vehicle = await Vehicle.create({
        vin: "TEST123NOCHANGE",
        licensePlate: "TEST-006",
        vehicleModel: "Test Model",
        manufacturer: "Test Manufacturer",
        year: 2024,
        type: "SEDAN",
        fuelType: "GASOLINE",
        status: "ACTIVE",
        connectionStatus: ConnectionStatus.ONLINE,
        lastSeenAt: thirtySecondsAgo,
      });

      const updatedAtBefore = vehicle.updatedAt;

      await connectionMonitor.checkStaleConnections();

      const updated = await Vehicle.findById(vehicle._id);
      expect(updated?.connectionStatus).toBe(ConnectionStatus.ONLINE);
      expect(updated?.updatedAt?.getTime()).toBe(updatedAtBefore?.getTime());
    });

    it("should handle vehicles with no lastSeenAt timestamp", async () => {
      await Vehicle.create({
        vin: "TEST123NOLASTSEEN",
        licensePlate: "TEST-007",
        vehicleModel: "Test Model",
        manufacturer: "Test Manufacturer",
        year: 2024,
        type: "SEDAN",
        fuelType: "GASOLINE",
        status: "ACTIVE",
        connectionStatus: ConnectionStatus.ONLINE,
      });

      await expect(connectionMonitor.checkStaleConnections()).resolves.not.toThrow();
    });
  });

  describe("Job scheduling", () => {
    it("should have correct cron configuration", () => {
      const status = connectionMonitor.getStatus();

      expect(status.name).toBe("ConnectionMonitor");
      expect(status.schedule).toBe("*/30 * * * * *"); // Every 30 seconds
      expect(status.enabled).toBe(true);
    });

    it("should start and stop correctly", () => {
      connectionMonitor.start();
      expect(connectionMonitor.getStatus().isActive).toBe(true);

      connectionMonitor.stop();
      expect(connectionMonitor.getStatus().isActive).toBe(false);
    });
  });
});
