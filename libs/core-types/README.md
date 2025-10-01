# @tenderd-fms/core-types

Shared TypeScript types for the Tenderd Fleet Management System.

## Structure

```
src/
├── enums/              # Shared enumerations
├── entity/             # Core domain entities
├── shared/             # Shared utilities (pagination, errors)
├── api/                # API request/response types
│   ├── vehicle/
│   ├── telemetry/
│   ├── maintenance/
│   └── analytics/
└── websocket/          # WebSocket event types
```

## Usage

### Import Everything

```typescript
import { Vehicle, VehicleType, CreateVehicleRequest } from '@tenderd-fms/core-types';
```

### Import Specific Categories

```typescript
import { VehicleType, VehicleStatus } from '@tenderd-fms/core-types/enums';

import { Vehicle, Telemetry } from '@tenderd-fms/core-types/entity';

import { CreateVehicleRequest } from '@tenderd-fms/core-types/api/vehicle';

import { VehicleUpdateEvent } from '@tenderd-fms/core-types/websocket';
```

## Categories

### Enums

- `VehicleType`, `VehicleStatus`, `FuelType`, `ConnectionStatus`
- `MaintenanceType`, `MaintenanceStatus`
- `ValidationSeverity`, `RejectionReason`

### Entities

- `Vehicle` - Vehicle entity with current telemetry
- `Telemetry` - Time-series telemetry data
- `Maintenance` - Maintenance records
- `DailyAnalytics` - Pre-computed daily analytics
- `ValidationLog` - Rejected telemetry logs

### API Types

Each domain has request/response types:

- **Vehicle**: Create, Update, Get, GetAll
- **Telemetry**: Save, SaveBatch, GetHistory
- **Maintenance**: Create, Update, GetHistory
- **Analytics**: GetVehicle, GetFleet, GetDaily

### WebSocket Events

- `VehicleUpdateEvent` - Real-time telemetry updates
- `VehicleStatusChangeEvent` - Connection status changes
- `VehicleOfflineEvent` - Vehicle went offline
- `VehicleReconnectedEvent` - Vehicle came back online
- `MaintenanceAlertEvent` - Maintenance notifications
- `AlertEvent` - General alerts

## Type Safety

All types are fully typed with TypeScript strict mode enabled. This ensures type safety across:

- ✅ Backend API
- ✅ Frontend Portal
- ✅ IoT Transmitter

## Development

```bash
# Type check
pnpm type-check
```
