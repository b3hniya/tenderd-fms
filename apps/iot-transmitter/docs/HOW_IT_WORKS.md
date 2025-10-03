# 🔬 IoT Transmitter - How It Works (Deep Dive)

**A detailed technical explanation of offline buffering, physics simulation, and edge case handling**

---

## 📋 Table of Contents

1. [Data Flow Architecture](#data-flow-architecture)
2. [Offline Buffering Logic](#offline-buffering-logic)
3. [Physics-Based Telemetry Generation](#physics-based-telemetry-generation)
4. [Batch Transmission Strategy](#batch-transmission-strategy)
5. [Edge Cases & Error Handling](#edge-cases--error-handling)
6. [Performance Considerations](#performance-considerations)

---

## 1. Data Flow Architecture

### Normal Operation (Online)

```
┌─────────────────────────────────────────────────────────────────┐
│                      Vehicle IoT Device                         │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
        ┌──────────────────────────────────────┐
        │  1. Collect Sensor Data (30s)        │
        │     - GPS: lat/lng                   │
        │     - Speed sensor: km/h             │
        │     - Fuel gauge: %                  │
        │     - OBD-II: RPM, temp, odometer    │
        └──────────────────────────────────────┘
                            │
                            ▼
        ┌──────────────────────────────────────┐
        │  2. Generate Telemetry Package       │
        │     {                                │
        │       vehicleId,                     │
        │       timestamp,                     │
        │       location: { lat, lng },        │
        │       speed, fuelLevel, ...          │
        │     }                                │
        └──────────────────────────────────────┘
                            │
                            ▼
        ┌──────────────────────────────────────┐
        │  3. Try HTTP POST to API             │
        │     POST /api/telemetry              │
        │     Timeout: 5 seconds               │
        └──────────────────────────────────────┘
                            │
                 ┌──────────┴──────────┐
                 │                     │
               SUCCESS                FAIL
                 │                     │
                 ▼                     ▼
        ┌────────────────┐    ┌──────────────────┐
        │  4a. Confirm   │    │  4b. Add to      │
        │   ✅ 200 OK    │    │   Buffer (FIFO)  │
        │   Continue     │    │   🔴 Offline     │
        └────────────────┘    └──────────────────┘
                                       │
                                       ▼
                            ┌──────────────────────┐
                            │  Wait 30s, try again │
                            │  (stays in buffer)   │
                            └──────────────────────┘
```

---

## 2. Offline Buffering Logic

### Why FIFO (First-In-First-Out)?

**Problem**: What happens when the buffer fills up (500 items)?

**Option A: Drop Oldest (FIFO)** ✅ **Chosen**

```typescript
if (buffer.length >= MAX_SIZE) {
  buffer.shift(); // Remove oldest
}
buffer.push(newTelemetry);
```

**Pros**:

- Preserves **most recent** data (more valuable)
- Prevents buffer overflow
- Simple to implement

**Cons**:

- Loses historical data if offline for > 4 hours

**Option B: Drop Newest**

```typescript
if (buffer.length >= MAX_SIZE) {
  return; // Don't add new data
}
buffer.push(newTelemetry);
```

**Pros**:

- Preserves historical sequence

**Cons**:

- Loses **current** position (critical for tracking)
- Can't update frontend with latest telemetry

**Option C: Persist to Disk**

```typescript
if (buffer.length >= MAX_SIZE) {
  await fs.writeFile('buffer.json', JSON.stringify(buffer));
  buffer = [];
}
```

**Pros**:

- Unlimited storage
- Survives device reboot

**Cons**:

- Disk I/O overhead
- Complex error handling (disk full, permissions)
- Overkill for most scenarios

---

### Buffer State Machine

```
┌──────────┐  Network OK  ┌──────────┐  Send Success  ┌──────────┐
│  EMPTY   │ ────────────▶│  SENDING │ ──────────────▶│  EMPTY   │
└──────────┘              └──────────┘                └──────────┘
     │                          │
     │ Network Fail             │ Send Fail
     ▼                          ▼
┌──────────┐              ┌──────────┐
│ BUFFERING│◀─────────────│ BUFFERING│
└──────────┘              └──────────┘
     │                          │
     │ Buffer Full              │ Network Restored
     ▼                          ▼
┌──────────┐               ┌──────────┐
│DROP OLDEST├─────────────▶│ FLUSHING │
└──────────┘               └──────────┘
                                │
                                │ Batch Success
                                ▼
                          ┌──────────┐
                          │  EMPTY   │
                          └──────────┘
```

---

### Buffer Implementation

```typescript
class BufferManager {
  private buffer: Telemetry[] = [];
  private readonly MAX_SIZE = 500;
  private isBuffering = false;

  add(telemetry: Telemetry): void {
    if (this.buffer.length >= this.MAX_SIZE) {
      const dropped = this.buffer.shift();
      logger.warn(`Buffer full, dropped telemetry from ${dropped.timestamp}`);
    }

    this.buffer.push(telemetry);
    this.isBuffering = true;

    logger.info(`Buffered telemetry (${this.buffer.length}/${this.MAX_SIZE})`);
  }

  getAll(): Telemetry[] {
    return this.buffer.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  clear(): void {
    this.buffer = [];
    this.isBuffering = false;
  }

  get isEmpty(): boolean {
    return this.buffer.length === 0;
  }

  get isFull(): boolean {
    return this.buffer.length >= this.MAX_SIZE;
  }
}
```

---

## 3. Physics-Based Telemetry Generation

### GPS Movement Simulation

**Haversine Formula** (calculate distance between two GPS points):

```typescript
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}
```

**Move Along Bearing** (calculate new position after traveling X km in direction Y):

```typescript
function moveAlongBearing(
  lat: number,
  lng: number,
  distanceKm: number,
  bearing: number,
): { lat: number; lng: number } {
  const R = 6371;
  const latRad = toRadians(lat);
  const lngRad = toRadians(lng);
  const bearingRad = toRadians(bearing);

  const newLatRad = Math.asin(
    Math.sin(latRad) * Math.cos(distanceKm / R) +
      Math.cos(latRad) * Math.sin(distanceKm / R) * Math.cos(bearingRad),
  );

  const newLngRad =
    lngRad +
    Math.atan2(
      Math.sin(bearingRad) * Math.sin(distanceKm / R) * Math.cos(latRad),
      Math.cos(distanceKm / R) - Math.sin(latRad) * Math.sin(newLatRad),
    );

  return {
    lat: toDegrees(newLatRad),
    lng: toDegrees(newLngRad),
  };
}
```

**Example Route Simulation**:

```typescript
class RouteGenerator {
  private waypoints: { lat: number; lng: number }[] = [
    { lat: 25.2048, lng: 55.2708 }, // Dubai Marina
    { lat: 25.1972, lng: 55.2744 }, // JBR
    { lat: 25.0764, lng: 55.1327 }, // Dubai Mall
    { lat: 25.2048, lng: 55.2708 }, // Back to start
  ];
  private currentWaypointIndex = 0;

  getNextPosition(
    currentPosition: { lat: number; lng: number },
    distanceKm: number,
  ): { lat: number; lng: number } {
    const nextWaypoint = this.waypoints[this.currentWaypointIndex];
    const bearing = this.calculateBearing(currentPosition, nextWaypoint);

    // Move towards waypoint
    const newPosition = moveAlongBearing(
      currentPosition.lat,
      currentPosition.lng,
      distanceKm,
      bearing,
    );

    // Check if reached waypoint (within 100m)
    const distanceToWaypoint = calculateDistance(
      newPosition.lat,
      newPosition.lng,
      nextWaypoint.lat,
      nextWaypoint.lng,
    );
    if (distanceToWaypoint < 0.1) {
      // Reached waypoint, move to next
      this.currentWaypointIndex = (this.currentWaypointIndex + 1) % this.waypoints.length;
    }

    return newPosition;
  }
}
```

---

### Speed & Acceleration

**Realistic Speed Changes** (no instant jumps):

```typescript
class SpeedController {
  private readonly MAX_ACCELERATION = 3; // m/s² (10.8 km/h per second)
  private readonly MAX_DECELERATION = 5; // m/s² (18 km/h per second)

  adjustSpeed(currentSpeed: number, targetSpeed: number, deltaTime: number): number {
    const deltaSpeed = targetSpeed - currentSpeed;

    if (deltaSpeed > 0) {
      // Accelerating
      const maxChange = this.MAX_ACCELERATION * deltaTime; // in m/s
      const maxChangeKmh = maxChange * 3.6;
      return currentSpeed + Math.min(deltaSpeed, maxChangeKmh);
    } else {
      // Decelerating
      const maxChange = this.MAX_DECELERATION * deltaTime;
      const maxChangeKmh = maxChange * 3.6;
      return currentSpeed + Math.max(deltaSpeed, -maxChangeKmh);
    }
  }
}
```

**Example**:

```
Current speed: 60 km/h
Target speed: 100 km/h
Time interval: 30 seconds

Max acceleration: 3 m/s² = 10.8 km/h/s
Max change in 30s: 10.8 * 30 = 324 km/h (unrealistic!)

Realistic change: (100 - 60) = 40 km/h
New speed: 60 + min(40, 324) = 100 km/h ✅
```

---

### Fuel Consumption Model

```typescript
class FuelModel {
  // Base consumption rates (L/100km)
  private readonly HIGHWAY_CONSUMPTION = 15;
  private readonly CITY_CONSUMPTION = 20;
  private readonly IDLE_CONSUMPTION = 1.5; // L/hour

  calculateConsumption(speed: number, distanceKm: number, idleTimeHours: number): number {
    if (speed === 0) {
      // Idling
      return this.IDLE_CONSUMPTION * idleTimeHours;
    } else if (speed > 80) {
      // Highway driving
      return (this.HIGHWAY_CONSUMPTION / 100) * distanceKm;
    } else {
      // City driving
      return (this.CITY_CONSUMPTION / 100) * distanceKm;
    }
  }

  adjustFuelLevel(currentLevel: number, consumed: number, tankCapacity: number): number {
    const newLevel = currentLevel - consumed;

    // Fuel level as percentage
    const percentage = (newLevel / tankCapacity) * 100;

    return Math.max(0, Math.min(100, percentage));
  }
}
```

---

## 4. Batch Transmission Strategy

### Sequential vs Parallel Transmission

**Sequential (Chosen)** ✅:

```typescript
async function flushBuffer() {
  const batches = splitIntoBatches(buffer, BATCH_SIZE);

  for (const batch of batches) {
    try {
      await apiClient.sendBatch(batch);
      logger.info(`✅ Batch sent (${batch.length} items)`);
    } catch (error) {
      logger.error(`❌ Batch failed, stopping flush`);
      return; // Keep remaining batches in buffer
    }
  }

  bufferManager.clear();
}
```

**Pros**:

- Guaranteed order
- Won't overwhelm server
- Easy to resume on failure

**Cons**:

- Slower (waits for each batch)

**Parallel**:

```typescript
async function flushBuffer() {
  const batches = splitIntoBatches(buffer, BATCH_SIZE);

  const promises = batches.map(batch => apiClient.sendBatch(batch));

  try {
    await Promise.all(promises);
    bufferManager.clear();
  } catch (error) {
    // Problem: which batches succeeded? Hard to know.
  }
}
```

**Pros**:

- Faster transmission

**Cons**:

- May arrive out of order (but MongoDB time-series handles this)
- Could overwhelm server
- Complex error recovery

---

### Why Batch Size = 50?

**Analysis**:

| Batch Size | Payload Size | Transmission Time (est) | Trade-offs                       |
| ---------- | ------------ | ----------------------- | -------------------------------- |
| 10         | 2 KB         | 50ms                    | Too many requests (overhead)     |
| 50         | 10 KB        | 100ms                   | ✅ **Optimal balance**           |
| 100        | 20 KB        | 200ms                   | Risk of timeout on slow networks |
| 500        | 100 KB       | 1s                      | Single point of failure          |

**Formula**:

```
Optimal batch size = sqrt(total items)

Example: 500 buffered items
Batches of 50 = 10 batches
Total time: 10 * 100ms = 1 second ✅

Batches of 10 = 50 batches
Total time: 50 * 50ms = 2.5 seconds (more overhead)
```

---

## 5. Edge Cases & Error Handling

### Edge Case 1: Network Flapping

**Problem**: Network goes offline → online → offline rapidly

**Without Protection**:

```
10:00:00 - Try send → FAIL → Buffer (1 item)
10:00:05 - Network restored
10:00:05 - Start flush (1 item)
10:00:06 - Network fails again → Flush fails → Buffer (1 item)
10:00:10 - Network restored
10:00:10 - Start flush (1 item)
... (endless cycle)
```

**Solution: Debounced Flush**:

```typescript
let flushTimer: NodeJS.Timeout | null = null;

async function onNetworkRestored() {
  if (flushTimer) {
    clearTimeout(flushTimer);
  }

  // Wait 5 seconds of stable connection before flushing
  flushTimer = setTimeout(async () => {
    await flushBuffer();
  }, 5000);
}
```

---

### Edge Case 2: Clock Drift

**Problem**: Device clock is wrong (e.g., set to 2020)

**Without Protection**:

```json
{
  "timestamp": "2020-01-01T00:00:00Z",
  "location": { "lat": 25.2048, "lng": 55.2708 }
}
```

**Backend receives telemetry "from the past"** → Breaks analytics

**Solution: Server-Side Timestamp Override**:

```typescript
// Backend API
app.post('/api/telemetry', (req, res) => {
  const telemetry = req.body;

  // Check if timestamp is reasonable (within 1 hour)
  const now = Date.now();
  const diff = Math.abs(now - new Date(telemetry.timestamp).getTime());

  if (diff > 3600000) {
    // Clock drift detected, use server time
    telemetry.timestamp = new Date();
    telemetry.validation.issues.push({
      field: 'timestamp',
      severity: 'WARNING',
      message: 'Clock drift detected, using server time',
    });
  }

  // Save with corrected timestamp
  await Telemetry.create(telemetry);
});
```

---

### Edge Case 3: Partial Batch Failure

**Problem**: Batch of 50 items, item #25 has invalid data

**Option A: Reject Entire Batch**:

```typescript
for (const item of batch) {
  if (!validate(item)) {
    throw new Error('Invalid item in batch');
  }
}
// All or nothing
await Telemetry.insertMany(batch);
```

**Pros**: Clean error handling
**Cons**: Lose 49 valid items

**Option B: Insert Valid, Log Invalid** ✅:

```typescript
const results = [];
for (const item of batch) {
  try {
    const validated = validate(item);
    const saved = await Telemetry.create(validated);
    results.push({ success: true, id: saved._id });
  } catch (error) {
    results.push({ success: false, error: error.message });
  }
}
return { results };
```

**Pros**: Preserves valid data
**Cons**: More complex

---

## 6. Performance Considerations

### Memory Usage

**Per Vehicle**:

```
Buffer: 500 items × 200 bytes = 100 KB
Simulator state: 1 KB
Total: ~101 KB per vehicle
```

**Fleet of 100 vehicles**:

```
100 vehicles × 101 KB = 10.1 MB
```

**Conclusion**: Memory is not a bottleneck

---

### CPU Usage

**Telemetry Generation**:

```
GPS calculation: ~1ms
Speed adjustment: ~0.1ms
Fuel calculation: ~0.1ms
Total: ~1.2ms per telemetry
```

**Fleet of 100 vehicles @ 30s interval**:

```
100 vehicles × 1.2ms = 120ms every 30 seconds
CPU usage: 0.4%
```

**Conclusion**: CPU is not a bottleneck

---

### Network Bandwidth

**Single Telemetry**:

```json
{
  "vehicleId": "60d5f9b8c8b9a82f4c8e4a1b",
  "timestamp": "2025-10-03T10:00:00Z",
  "location": { "lat": 25.2048, "lng": 55.2708 },
  "speed": 65,
  "fuelLevel": 78.5,
  "odometer": 125432.8,
  "engineTemp": 85,
  "engineRPM": 2500
}
```

**Size**: ~200 bytes (JSON)

**Fleet of 100 vehicles @ 30s interval**:

```
100 vehicles × 200 bytes = 20 KB every 30 seconds
Bandwidth: 0.67 KB/s = 5.3 Kbps
```

**Conclusion**: Network is not a bottleneck (even on 3G)

---

## 🔗 Links

- **Main README**: [../../../README.md](../../../README.md)
- **IoT Transmitter README**: [../README.md](../README.md)
- **Backend API README**: [../../api/README.md](../../api/README.md)

---

<div align="center">

**Part of [Tenderd Fleet Management System](../../../README.md)**

</div>
