# 🔌 Tenderd FMS - Backend API

**Express.js API with CQRS architecture, Event-Driven design, and MongoDB time-series**

---

## 📋 Overview

The Backend API is the core of the Tenderd FMS, handling all business logic, data persistence, real-time communication, and background jobs.

### Architecture Highlights

- **CQRS Pattern**: Separated Command (write) and Query (read) operations
- **Event-Driven**: Command handlers publish events → Event handlers react
- **Dependency Injection**: TSyringe container for testable, decoupled code
- **Time-Series Optimization**: MongoDB time-series collections for telemetry (6x compression)
- **WebSocket Broadcasting**: Socket.IO for real-time frontend updates
- **Background Jobs**: node-cron for connection monitoring

---

## 🏗 Project Structure

```
apps/api/src/
├── infrastructure/           # Cross-cutting concerns
│   ├── configs/
│   │   ├── logger.ts         # Winston logger
│   │   └── swagger.ts        # OpenAPI/Swagger setup
│   ├── decorators/
│   │   ├── command-handler.ts # @CommandHandler decorator
│   │   ├── query-handler.ts   # @QueryHandler decorator
│   │   └── event-handler.ts   # @EventHandler decorator
│   ├── event-source/         # CQRS implementation
│   │   ├── bootstrap.ts      # Scan & register handlers
│   │   ├── command-bus.ts    # Command dispatcher
│   │   ├── query-bus.ts      # Query dispatcher
│   │   ├── event-bus.ts      # Event publisher/subscriber
│   │   ├── container.ts      # TSyringe DI container
│   │   └── scanner.ts        # Auto-discover handlers
│   ├── jobs/
│   │   ├── base-job.ts       # Abstract job class
│   │   └── connection-monitor.service.ts # Connection status monitoring
│   ├── middlewares/
│   │   ├── error-middleware.ts # Global error handler
│   │   ├── request-logger.ts   # HTTP request logging
│   │   └── dynamic-router.ts   # Auto-register controllers
│   ├── persistence/
│   │   └── database.ts       # MongoDB connection
│   ├── utils/
│   │   ├── async-controller-wrapper.ts # Async route wrapper
│   │   ├── string-util.ts    # String helpers
│   │   └── validate-env.ts   # Environment validation
│   └── websocket/
│       └── socket-handler.ts # Socket.IO setup
│
├── modules/                  # Domain modules (Vertical Slices)
│   ├── vehicle/
│   │   ├── commands/         # CreateVehicle
│   │   │   └── create-vehicle/
│   │   │       ├── create-vehicle-command.ts
│   │   │       ├── create-vehicle.handler.ts
│   │   │       ├── create-vehicle.validator.ts
│   │   │       └── __tests__/
│   │   ├── queries/          # GetAllVehicles, GetVehicleById
│   │   │   ├── get-all-vehicles/
│   │   │   └── get-vehicle-by-id/
│   │   ├── models/           # Mongoose schemas
│   │   │   └── vehicle.ts
│   │   ├── repositories/
│   │   │   └── vehicle.repository.ts
│   │   └── controllers/
│   │       └── v1/
│   │           └── vehicle.controller.ts
│   │
│   ├── telemetry/
│   │   ├── commands/         # SaveTelemetry, SaveTelemetryBatch
│   │   │   ├── save-telemetry/
│   │   │   └── save-telemetry-batch/
│   │   ├── queries/          # GetTelemetryHistory
│   │   │   └── get-telemetry-history/
│   │   ├── event-handlers/
│   │   │   └── broadcast-telemetry/
│   │   │       └── telemetry-recieved.handler.ts
│   │   ├── models/
│   │   │   ├── telemetry.ts
│   │   │   └── validation-log.ts
│   │   └── controllers/
│   │       └── v1/
│   │           └── telemetry.controller.ts
│   │
│   ├── maintenance/
│   │   ├── commands/         # CreateMaintenance, UpdateMaintenance
│   │   ├── queries/          # GetMaintenanceHistory, GetMaintenanceById
│   │   ├── models/
│   │   │   └── maintenance.ts
│   │   └── controllers/
│   │       └── v1/
│   │           └── maintenance.controller.ts
│   │
│   └── analytics/
│       ├── commands/         # CalculateDailyAnalytics
│       ├── queries/          # GetVehicleAnalytics, GetFleetAnalytics
│       ├── event-handlers/
│       │   └── update-analytics/
│       │       └── on-telemetry-recieved-update-analytics.handler.ts
│       ├── models/
│       │   ├── daily-analytics.ts
│       │   └── vehicle-analytics.ts
│       └── controllers/
│           └── v1/
│               ├── analytics.controller.ts
│               └── fleet.controller.ts
│
├── shared/                   # Shared across modules
│   └── events/               # Domain events
│       ├── telemetry-received-event.ts
│       ├── vehicle-created-event.ts
│       ├── vehicle-offline-event.ts
│       └── vehicle-reconnected-event.ts
│
├── app.ts                    # Express app setup
└── server.ts                 # Server entry point
```

---

## 🎯 CQRS Pattern Explained

### Command Flow (Write Operations)

```
Controller → CommandBus.execute(command) → CommandHandler → Repository → MongoDB
                                                ↓
                                        EventBus.publish(event)
                                                ↓
                                          EventHandlers (async)
```

**Example: Create Vehicle**

```typescript
// 1. Controller receives request
POST /api/vehicle
body: { vin: "ABC123", ... }

// 2. Controller creates command
const command = new CreateVehicleCommand(data);

// 3. CommandBus dispatches to handler
await commandBus.execute(command);

// 4. Handler validates & saves
const vehicle = new Vehicle(command.data);
await vehicle.save();

// 5. Handler publishes event
await eventBus.publish(new VehicleCreatedEvent(vehicle));

// 6. Event handlers react (async, non-blocking)
- UpdateAnalyticsHandler: Increment total vehicle count
- LoggingHandler: Log creation for audit trail
```

### Query Flow (Read Operations)

```
Controller → QueryBus.execute(query) → QueryHandler → Repository → MongoDB → Result
```

**Example: Get All Vehicles**

```typescript
// 1. Controller receives request
GET /api/vehicle?page=1&limit=10&status=ACTIVE

// 2. Controller creates query
const query = new GetAllVehiclesQuery({ page: 1, limit: 10, status: 'ACTIVE' });

// 3. QueryBus dispatches to handler
const result = await queryBus.execute(query);

// 4. Handler fetches from DB
const vehicles = await Vehicle.find({ status: 'ACTIVE' })
  .skip(0)
  .limit(10);

// 5. Return result to controller
return { data: vehicles, pagination: {...} };
```

### Event Flow (Asynchronous Reactions)

```
Command Handler → EventBus.publish(event) → All registered EventHandlers (parallel)
```

**Example: Telemetry Received**

```typescript
// 1. SaveTelemetryHandler publishes event
await eventBus.publish(new TelemetryReceivedEvent(telemetry));

// 2. Multiple handlers react (parallel):

// Handler A: Broadcast via WebSocket
@EventHandler(TelemetryReceivedEvent)
class BroadcastTelemetryHandler {
  handle(event) {
    io.emit("telemetry:update", event.telemetryData);
  }
}

// Handler B: Update analytics
@EventHandler(TelemetryReceivedEvent)
class UpdateAnalyticsHandler {
  handle(event) {
    await DailyAnalytics.updateOne({ vehicleId, date }, { $inc: { distanceTraveled: delta } });
  }
}
```

---

## 🔌 API Endpoints

### Vehicle Module

| Method | Endpoint           | Description                                          |
| ------ | ------------------ | ---------------------------------------------------- |
| POST   | `/api/vehicle`     | Create new vehicle                                   |
| GET    | `/api/vehicle`     | List vehicles (supports search, filters, pagination) |
| GET    | `/api/vehicle/:id` | Get vehicle by ID                                    |

**Query Parameters for GET /api/vehicle:**

- `?vin=ABC123` - Search by VIN
- `?id=60d5f9b8c8b9a82f4c8e4a1b` - Get by ID
- `?status=ACTIVE` - Filter by status (ACTIVE, MAINTENANCE, INACTIVE)
- `?type=TRUCK` - Filter by type (TRUCK, VAN, SEDAN, SUV, BUS)
- `?page=1&limit=10` - Pagination

### Telemetry Module

| Method | Endpoint                 | Description                                  |
| ------ | ------------------------ | -------------------------------------------- |
| POST   | `/api/telemetry`         | Save single telemetry                        |
| POST   | `/api/telemetry/batch`   | Save batch telemetry (from IoT buffer flush) |
| GET    | `/api/telemetry/history` | Get telemetry history with filters           |

**Query Parameters for GET /api/telemetry/history:**

- `?vehicleId=60d5f9b8c8b9a82f4c8e4a1b` - Filter by vehicle
- `?startDate=2025-10-01T00:00:00Z` - Start date
- `?endDate=2025-10-03T23:59:59Z` - End date
- `?page=1&limit=100` - Pagination

### Maintenance Module

| Method | Endpoint                              | Description                             |
| ------ | ------------------------------------- | --------------------------------------- |
| POST   | `/api/maintenance`                    | Create maintenance record               |
| PATCH  | `/api/maintenance/:id`                | Update maintenance (status, completion) |
| GET    | `/api/maintenance/:id`                | Get single maintenance record           |
| GET    | `/api/maintenance/vehicle/:vehicleId` | Get maintenance history for vehicle     |

### Analytics Module

| Method | Endpoint                                  | Description                        |
| ------ | ----------------------------------------- | ---------------------------------- |
| GET    | `/api/analytics/vehicle/:vehicleId`       | Get analytics for specific vehicle |
| GET    | `/api/analytics/fleet`                    | Get fleet-wide analytics           |
| GET    | `/api/analytics/vehicle/:vehicleId/daily` | Get daily analytics (date range)   |

---

## 🗄 Database Schema

### Time-Series Collections (Optimized for Telemetry)

**`telemetry` collection:**

```javascript
{
  _id: ObjectId,
  vehicleId: ObjectId,
  timestamp: Date,         // Time-series key field
  location: {
    type: "Point",
    coordinates: [lng, lat]
  },
  speed: Number,
  fuelLevel: Number,
  odometer: Number,
  engineTemp: Number,
  engineRPM: Number,
  validation: {
    schemaValid: Boolean,
    contextValid: Boolean,
    issues: [
      { field: "location", severity: "WARNING", message: "..." }
    ]
  },
  receivedAt: Date
}
```

**Benefits of Time-Series:**

- **6x compression** vs normal collection
- **Optimized range queries** (`timestamp` between dates)
- **Automatic bucketing** for aggregations
- **Fast inserts** (append-only, no updates)

### Standard Collections

**`vehicles` collection:**

```javascript
{
  _id: ObjectId,
  vin: String (unique),
  licensePlate: String (unique),
  model: String,
  manufacturer: String,
  year: Number,
  type: "TRUCK" | "VAN" | "SEDAN" | "SUV" | "BUS",
  fuelType: "GASOLINE" | "DIESEL" | "ELECTRIC" | "HYBRID",
  status: "ACTIVE" | "MAINTENANCE" | "INACTIVE",
  connectionStatus: "ONLINE" | "STALE" | "OFFLINE",
  lastSeenAt: Date,
  currentTelemetry: { ... },  // Latest telemetry snapshot
  odometer: Number,
  createdAt: Date,
  updatedAt: Date
}
```

**`maintenance` collection:**

```javascript
{
  _id: ObjectId,
  vehicleId: ObjectId,
  type: "ROUTINE" | "REPAIR" | "INSPECTION",
  description: String,
  status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED",
  parts: [
    { name: String, quantity: Number, cost: Number }
  ],
  laborHours: Number,
  laborCostPerHour: Number,
  totalCost: Number,  // Auto-calculated
  scheduledDate: Date,
  completedDate: Date,
  createdAt: Date,
  updatedAt: Date
}
```

**`daily_analytics` collection:**

```javascript
{
  _id: ObjectId,
  vehicleId: ObjectId,
  date: Date (YYYY-MM-DD),
  distanceTraveled: Number,
  fuelConsumed: Number,
  averageSpeed: Number,
  maxSpeed: Number,
  engineHours: Number,
  idleTime: Number,
  validationIssuesCount: Number,
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🧪 Testing

### Run Tests

```bash
# All tests
pnpm test

# Watch mode (auto-rerun on changes)
pnpm test:watch

# Coverage report
pnpm test:coverage

# Specific test file
pnpm test -- save-telemetry.handler.test.ts
```

### Test Structure

```
src/modules/vehicle/commands/create-vehicle/__tests__/
├── create-vehicle.handler.test.ts       # Handler logic tests
└── create-vehicle.validator.test.ts     # Validation tests
```

### Example Test (Handler)

```typescript
import { CreateVehicleHandler } from '../create-vehicle.handler';
import { CreateVehicleCommand } from '../create-vehicle-command';
import { Vehicle } from '../../../models/vehicle';

describe('CreateVehicleHandler', () => {
  let handler: CreateVehicleHandler;

  beforeEach(() => {
    handler = new CreateVehicleHandler();
  });

  it('should create a vehicle with valid data', async () => {
    const command = new CreateVehicleCommand({
      vin: '1HGBH41JXMN109186',
      licensePlate: 'ABC-1234',
      model: 'Ford F-150',
      manufacturer: 'Ford',
      year: 2024,
      type: 'TRUCK',
      fuelType: 'DIESEL',
      status: 'ACTIVE',
    });

    const result = await handler.execute(command);

    expect(result).toBeDefined();
    expect(result.vin).toBe('1HGBH41JXMN109186');
    expect(result.model).toBe('Ford F-150');

    // Verify saved to DB
    const saved = await Vehicle.findOne({ vin: '1HGBH41JXMN109186' });
    expect(saved).toBeDefined();
  });

  it('should reject duplicate VIN', async () => {
    // Create first vehicle
    await new Vehicle({ vin: 'ABC123', ... }).save();

    // Try to create duplicate
    const command = new CreateVehicleCommand({ vin: 'ABC123', ... });

    await expect(handler.execute(command)).rejects.toThrow('VIN already exists');
  });
});
```

### Testing with mongodb-memory-server

All tests use an in-memory MongoDB instance:

- **Isolated**: Each test gets a clean database
- **Fast**: No network I/O
- **Parallel**: Tests run concurrently
- **No Setup**: Auto-starts/stops

**Setup** (`jest.setup.ts`):

```typescript
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  // Clear all collections after each test
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});
```

---

## 🔄 Background Jobs

### Connection Monitor Service

**Purpose**: Detect when vehicles go offline without waiting for frontend polling

**Runs**: Every 30 seconds (node-cron)

**Logic**:

```typescript
class ConnectionMonitorService extends BaseJob {
  STALE_THRESHOLD_MS = 60 * 1000; // 1 minute
  OFFLINE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

  async checkStaleConnections() {
    const vehicles = await Vehicle.find({ status: "ACTIVE" });

    for (const vehicle of vehicles) {
      const timeSinceLastSeen = Date.now() - vehicle.lastSeenAt.getTime();

      let newStatus;
      if (timeSinceLastSeen < STALE_THRESHOLD_MS) {
        newStatus = "ONLINE";
      } else if (timeSinceLastSeen < OFFLINE_THRESHOLD_MS) {
        newStatus = "STALE";
      } else {
        newStatus = "OFFLINE";
      }

      if (newStatus !== vehicle.connectionStatus) {
        await Vehicle.updateOne({ _id: vehicle._id }, { connectionStatus: newStatus });

        // Publish events
        if (newStatus === "OFFLINE") {
          await eventBus.publish(new VehicleOfflineEvent(vehicle._id, vehicle.vin));
        } else if (newStatus === "ONLINE" && vehicle.connectionStatus === "OFFLINE") {
          await eventBus.publish(new VehicleReconnectedEvent(vehicle._id, vehicle.vin));
        }

        // Broadcast via WebSocket
        io.emit("vehicle:status-change", {
          vehicleId: vehicle._id,
          vin: vehicle.vin,
          oldStatus: vehicle.connectionStatus,
          newStatus,
        });
      }
    }
  }
}
```

---

## 🚀 Environment Variables

```env
# Server
PORT=4000
NODE_ENV=development

# Database
MONGO_URI=mongodb://localhost:27017/tenderd-fms

# Logging
LOG_LEVEL=info  # debug, info, warn, error

# WebSocket (optional, defaults to same port as HTTP)
WS_PORT=4000
```

---

## 📚 Additional Docs

See `docs/` folder for detailed guides:

- `CQRS-Complete-Guide.md` - Deep dive into CQRS implementation
- `modules-structure.md` - Module organization conventions

---

## 🔗 Links

- **Main README**: [../../README.md](../../README.md)
- **Swagger API Docs**: http://localhost:4000/api-docs (when running)
- **Frontend README**: [../portal/README.md](../portal/README.md)
- **IoT Transmitter README**: [../iot-transmitter/README.md](../iot-transmitter/README.md)

---

<div align="center">

**Part of [Tenderd Fleet Management System](../../README.md)**

</div>
