# 🛰️ Tenderd FMS - IoT Transmitter

**Realistic vehicle telemetry simulator with offline buffering and batch transmission**

---

## 📋 Overview

The IoT Transmitter simulates real vehicle IoT devices that collect and transmit telemetry data to the backend API. It includes:

- **Physics-based GPS simulation** with realistic routes
- **Offline buffering** with FIFO queue (500 items)
- **Batch transmission** on reconnection (chunks of 50)
- **Exponential backoff retry** logic (2s, 4s, 8s)
- **Multiple vehicle simulation** with different scenarios

---

## 🏗 Project Structure

```
apps/iot-transmitter/
├── src/
│   ├── simulator/              # Vehicle simulation logic
│   │   ├── vehicle-simulator.ts     # Main simulator class
│   │   ├── telemetry-generator.ts   # Generate realistic telemetry
│   │   └── route-generator.ts       # GPS route simulation
│   ├── buffer/                 # Offline buffering
│   │   ├── buffer-manager.ts        # FIFO buffer (500 items)
│   │   └── storage.ts               # Persistent storage (optional)
│   ├── api-client/             # HTTP client with retry
│   │   ├── telemetry-client.ts      # API client for telemetry endpoints
│   │   └── retry-logic.ts           # Exponential backoff
│   ├── scenarios/              # Pre-defined scenarios
│   │   ├── normal-operation.ts      # Standard 30s interval
│   │   ├── offline-scenario.ts      # Random offline periods
│   │   └── heavy-traffic.ts         # High-frequency transmission
│   ├── config/
│   │   └── vehicles.json            # Vehicle configurations
│   ├── index.ts                # Entry point (start simulation)
│   └── types.ts                # TypeScript types
│
├── docs/                       # Documentation
│   ├── HOW_IT_WORKS.md         # Deep dive into buffering & physics
│   └── images/                 # Diagrams/screenshots
│
├── .env.example                # Environment variables template
├── package.json
└── tsconfig.json
```

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Environment Variables

Create `.env` file:

```env
API_URL=http://localhost:4000
TRANSMISSION_INTERVAL=30000      # 30 seconds
VEHICLE_COUNT=3                  # Number of vehicles to simulate
OFFLINE_PROBABILITY=0.05         # 5% chance of going offline
OFFLINE_DURATION_MIN=300000      # 5 minutes
OFFLINE_DURATION_MAX=1200000     # 20 minutes
LOG_LEVEL=info                   # debug, info, warn, error
```

### 3. Start Simulation

```bash
pnpm start
```

**Output:**

```
🚀 IoT Transmitter starting...
📡 Loading vehicles from database...
✅ Found 3 vehicles: V001, V002, V003

🟢 V001 (ABC-123) - Starting simulator
🟢 V002 (XYZ-456) - Starting simulator
🟢 V003 (DEF-789) - Starting simulator

[10:15:30] V001 → API | lat: 25.2048, lng: 55.2708, speed: 65 km/h | ✅ 200 OK
[10:16:00] V002 → API | lat: 25.2150, lng: 55.2810, speed: 72 km/h | ✅ 200 OK
[10:16:30] V003 → API | lat: 25.1950, lng: 55.2600, speed: 58 km/h | ✅ 200 OK

[10:17:00] V001 → API | OFFLINE (timeout) | 🔴 Buffered (1 item)
[10:17:30] V001 → API | OFFLINE | 🔴 Buffered (2 items)
...
[10:22:00] V001 → API | lat: 25.2100, lng: 55.2750, speed: 60 km/h | ✅ 200 OK
[10:22:02] V001 → API | 📤 Flushing buffer (10 items)
[10:22:03] V001 → API | Batch sent successfully | ✅ 200 OK
```

---

## 🎯 Features

### 1️⃣ Physics-Based Telemetry Generation

**Realistic GPS Routes:**

- Start from last known position (or random location in Dubai)
- Calculate realistic speed based on road type:
  - Highway: 80-120 km/h
  - City street: 30-60 km/h
  - Residential: 15-40 km/h
- Acceleration/deceleration curves (not instant speed changes)
- Direction changes based on route waypoints

**Engine Metrics:**

- **Engine RPM**: Correlated with speed (1500-4000 RPM)
- **Engine Temperature**: Gradual heating (70-95°C normal, 95-105°C warning)
- **Fuel Consumption**: Based on speed, engine load, idle time
  - Highway: 15 L/100km
  - City: 20 L/100km
  - Idle: 1.5 L/hour

**Odometer:**

- Monotonically increasing (never decreases)
- Calculated from distance traveled (Haversine formula)

**Example:**

```typescript
class TelemetryGenerator {
  generateNext(lastTelemetry: Telemetry): Telemetry {
    // Calculate new position (30s at current speed)
    const distanceKm = (lastTelemetry.speed / 3600) * 30; // km in 30s
    const newLocation = this.moveAlongRoute(lastTelemetry.location, distanceKm);

    // Adjust speed (acceleration/braking)
    const newSpeed = this.adjustSpeed(lastTelemetry.speed, roadType);

    // Engine RPM based on speed
    const engineRPM = 1500 + (newSpeed / 120) * 2500; // 1500-4000 RPM

    // Fuel consumption
    const fuelConsumed = (lastTelemetry.speed / 100) * 15 * (30 / 3600); // L
    const newFuelLevel = Math.max(0, lastTelemetry.fuelLevel - fuelConsumed);

    // Odometer
    const newOdometer = lastTelemetry.odometer + distanceKm;

    return {
      vehicleId: lastTelemetry.vehicleId,
      timestamp: new Date(),
      location: newLocation,
      speed: newSpeed,
      fuelLevel: newFuelLevel,
      odometer: newOdometer,
      engineTemp: this.adjustEngineTemp(lastTelemetry.engineTemp, newSpeed),
      engineRPM,
    };
  }
}
```

---

### 2️⃣ Offline Buffering (FIFO Queue)

**Buffer Manager:**

```typescript
class BufferManager {
  private buffer: Telemetry[] = [];
  private readonly MAX_SIZE = 500;

  add(telemetry: Telemetry): void {
    if (this.buffer.length >= this.MAX_SIZE) {
      // Drop oldest item (FIFO)
      this.buffer.shift();
      console.warn(`⚠️ Buffer full, dropped oldest item`);
    }
    this.buffer.push(telemetry);
    console.log(`🔴 Buffered (${this.buffer.length} items)`);
  }

  getAll(): Telemetry[] {
    return this.buffer.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  clear(): void {
    this.buffer = [];
  }

  get size(): number {
    return this.buffer.length;
  }
}
```

**When to Buffer:**

- HTTP request times out (network offline)
- API returns 500 error (server down)
- DNS resolution fails (no internet)

**Buffer Capacity:**

- **500 items** = 250 minutes (4+ hours) at 30s interval
- **Memory usage**: ~100 KB (200 bytes per telemetry)

---

### 3️⃣ Batch Transmission on Reconnection

**Flush Strategy:**

```typescript
async function flushBuffer() {
  const buffered = bufferManager.getAll();

  if (buffered.length === 0) return;

  console.log(`📤 Flushing buffer (${buffered.length} items)`);

  const BATCH_SIZE = 50;
  const batches = [];

  for (let i = 0; i < buffered.length; i += BATCH_SIZE) {
    batches.push(buffered.slice(i, i + BATCH_SIZE));
  }

  for (const batch of batches) {
    try {
      await apiClient.sendBatch(batch);
      console.log(`✅ Batch sent (${batch.length} items)`);
    } catch (error) {
      console.error(`❌ Batch failed, keeping in buffer`);
      // Stop flushing, will retry later
      return;
    }
  }

  // All batches sent successfully
  bufferManager.clear();
  console.log(`🎉 Buffer flushed successfully`);
}
```

**Why Batch Size = 50?**

- **Balance**: Not too small (overhead), not too large (timeout risk)
- **API Limit**: Most APIs have payload size limits (~1-2 MB)
- **Network**: 50 items ≈ 10 KB, safe for slow connections

---

### 4️⃣ Exponential Backoff Retry

**Retry Logic:**

```typescript
class TelemetryClient {
  async send(telemetry: Telemetry, retries = 0): Promise<boolean> {
    const MAX_RETRIES = 3;

    try {
      const response = await fetch(`${API_URL}/api/telemetry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(telemetry),
        timeout: 5000, // 5s timeout
      });

      if (response.ok) {
        return true; // Success
      } else if (response.status >= 500 && retries < MAX_RETRIES) {
        // Server error, retry with backoff
        const delay = Math.pow(2, retries) * 1000; // 2s, 4s, 8s
        console.warn(`⚠️ Server error, retrying in ${delay}ms...`);
        await sleep(delay);
        return this.send(telemetry, retries + 1);
      } else {
        // Client error (400, 401, etc) or max retries reached
        throw new Error(`API error: ${response.status}`);
      }
    } catch (error) {
      if (retries < MAX_RETRIES) {
        // Network error, retry
        const delay = Math.pow(2, retries) * 1000;
        console.warn(`⚠️ Network error, retrying in ${delay}ms...`);
        await sleep(delay);
        return this.send(telemetry, retries + 1);
      } else {
        // Max retries reached, consider offline
        console.error(`❌ Failed after ${MAX_RETRIES} retries`);
        return false;
      }
    }
  }
}
```

**Backoff Sequence:**

1. First attempt: Immediate
2. Retry 1: Wait 2 seconds
3. Retry 2: Wait 4 seconds
4. Retry 3: Wait 8 seconds
5. Give up: Mark as offline, buffer data

---

## 🎬 Simulation Scenarios

### Scenario 1: Normal Operation

**Config:**

```env
TRANSMISSION_INTERVAL=30000
OFFLINE_PROBABILITY=0.00
```

**Behavior:**

- Transmit every 30 seconds
- Never go offline
- Used for testing API under normal load

---

### Scenario 2: Random Offline Periods

**Config:**

```env
TRANSMISSION_INTERVAL=30000
OFFLINE_PROBABILITY=0.05
OFFLINE_DURATION_MIN=300000      # 5 min
OFFLINE_DURATION_MAX=1200000     # 20 min
```

**Behavior:**

- 5% chance per transmission of going offline
- Stay offline for 5-20 minutes (random)
- Buffer data during offline period
- Flush buffer on reconnection

**Use Case:** Simulate tunnels, rural areas, network outages

---

### Scenario 3: High-Frequency Transmission

**Config:**

```env
TRANSMISSION_INTERVAL=5000       # 5 seconds
OFFLINE_PROBABILITY=0.00
```

**Behavior:**

- Transmit every 5 seconds (high-frequency)
- Used for stress testing API

---

### Scenario 4: Heavy Traffic (Multiple Vehicles)

**Config:**

```env
VEHICLE_COUNT=20
TRANSMISSION_INTERVAL=30000
```

**Behavior:**

- Simulate 20 vehicles
- Each transmits every 30 seconds
- **Load**: 40 requests/minute, 2400 requests/hour

---

## 📊 Metrics & Logging

### Console Output

**Normal Transmission:**

```
[10:15:30] V001 → API | lat: 25.2048, lng: 55.2708, speed: 65 km/h | ✅ 200 OK
```

**Offline Detection:**

```
[10:17:00] V001 → API | OFFLINE (timeout) | 🔴 Buffered (1 item)
```

**Buffer Flush:**

```
[10:22:02] V001 → API | 📤 Flushing buffer (10 items)
[10:22:03] V001 → API | Batch 1/1 sent | ✅ 200 OK
```

**Retry:**

```
[10:18:15] V002 → API | ⚠️ Server error (503), retrying in 2000ms...
[10:18:17] V002 → API | ✅ 200 OK (retry 1)
```

---

## 🔧 Configuration

### Environment Variables

| Variable                | Default                 | Description                         |
| ----------------------- | ----------------------- | ----------------------------------- |
| `API_URL`               | `http://localhost:4000` | Backend API URL                     |
| `TRANSMISSION_INTERVAL` | `30000`                 | Interval between transmissions (ms) |
| `VEHICLE_COUNT`         | `3`                     | Number of vehicles to simulate      |
| `OFFLINE_PROBABILITY`   | `0.05`                  | Chance of going offline (0-1)       |
| `OFFLINE_DURATION_MIN`  | `300000`                | Min offline duration (ms)           |
| `OFFLINE_DURATION_MAX`  | `1200000`               | Max offline duration (ms)           |
| `BUFFER_MAX_SIZE`       | `500`                   | Max buffer items (FIFO)             |
| `BATCH_SIZE`            | `50`                    | Items per batch on flush            |
| `MAX_RETRIES`           | `3`                     | Max retry attempts                  |
| `LOG_LEVEL`             | `info`                  | Logging level                       |

---

## 📚 Additional Documentation

See `docs/` folder for deep dives:

- **[docs/HOW_IT_WORKS.md](docs/HOW_IT_WORKS.md)** - Detailed explanation of buffering logic, physics simulation, edge cases

---

## 🔗 Links

- **Main README**: [../../README.md](../../README.md)
- **Backend API README**: [../api/README.md](../api/README.md)
- **Frontend Portal README**: [../portal/README.md](../portal/README.md)

---

<div align="center">

**Part of [Tenderd Fleet Management System](../../README.md)**

</div>
