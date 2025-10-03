# 🖥️ Tenderd FMS - Frontend Portal

**Next.js 15 + React 19 dashboard with real-time tracking, analytics, and dark mode**

---

## 📋 Overview

The Frontend Portal is a modern, responsive web application for managing fleet operations, viewing real-time vehicle tracking, logging maintenance, and analyzing fleet performance.

### Key Features

- **Real-time Map Tracking**: Live vehicle markers with WebSocket updates
- **Vehicle Management**: Register, search, filter vehicles with pagination
- **Maintenance Logging**: Create/update maintenance records with auto-calculated costs
- **Analytics Dashboard**: Interactive charts (Recharts) for distance, fuel, vehicle types
- **Dark Mode**: Beautiful dark theme with Tailwind CSS
- **Type-Safe**: Full TypeScript with shared types from `@tenderd-fms/core-types`
- **Form Validation**: React Hook Form + Zod for robust client-side validation

---

## 🏗 Project Structure

```
apps/portal/
├── app/
│   ├── dashboard/              # Main dashboard layout
│   │   ├── layout.tsx          # Sidebar navigation
│   │   ├── page.tsx            # Redirect to /dashboard/tracking
│   │   ├── tracking/           # Real-time map tracking
│   │   │   ├── page.tsx        # Main tracking page
│   │   │   └── MapView.tsx     # Leaflet map component
│   │   ├── vehicles/           # Vehicle management
│   │   │   ├── page.tsx        # Vehicle list + registration form
│   │   │   ├── Pagination.tsx  # Pagination component
│   │   │   └── Toast.tsx       # Toast notifications
│   │   ├── maintenance/        # Maintenance management
│   │   │   ├── page.tsx        # Maintenance list + create/update forms
│   │   │   ├── Pagination.tsx
│   │   │   └── Toast.tsx
│   │   └── analytics/          # Analytics dashboard
│   │       ├── page.tsx        # Charts and fleet metrics
│   │       └── components/
│   │           └── CustomTooltip.tsx
│   ├── config/
│   │   └── api.ts              # API base URL config
│   ├── favicon.ico
│   ├── globals.css             # Tailwind global styles
│   └── layout.tsx              # Root layout
│
├── public/                     # Static assets
│   ├── file.svg
│   ├── globe.svg
│   └── ...
│
├── next.config.ts              # Next.js configuration
├── tailwind.config.ts          # Tailwind CSS config
├── tsconfig.json               # TypeScript config
└── package.json
```

---

## 🎨 Pages Overview

### 1️⃣ Real-time Tracking (`/dashboard/tracking`)

**Purpose**: Monitor fleet in real-time on an interactive map

**Features**:

- **Leaflet Map**: Custom truck icon markers
- **Color-coded Status**:
  - 🟢 **Green**: Online (last seen < 60s)
  - 🟡 **Yellow**: Stale (60s - 5min)
  - 🔴 **Red**: Offline (> 5min)
- **Vehicle Path**: Draw polyline for last hour of telemetry
- **WebSocket Updates**: Real-time marker position updates
- **Toast Notifications**: Status change alerts (ONLINE, STALE, OFFLINE)
- **Side Panel**: Vehicle details, current speed, fuel, odometer

**Components**:

- `page.tsx`: Main page with WebSocket client integration
- `MapView.tsx`: Leaflet map with markers, popups, paths (client-side only)

**WebSocket Events Handled**:

- `telemetry:update` → Update marker position, add to path
- `vehicle:offline` → Change marker to red, show toast
- `vehicle:reconnected` → Change marker to green, show toast
- `vehicle:status-change` → Handle all status transitions

---

### 2️⃣ Vehicles (`/dashboard/vehicles`)

**Purpose**: Manage fleet vehicles (register, search, filter)

**Features**:

- **Vehicle Table**: VIN, license plate, model, type, status, connection
- **Search**: By VIN with real-time filtering
- **Filters**: Status (Active/Maintenance/Inactive), Type (Truck/Van/etc)
- **Pagination**: 10 items per page
- **Add Vehicle Modal**: Registration form with Zod validation
  - Fields: VIN, license plate, model, manufacturer, year, type, fuel type, status
  - Client-side validation (VIN format, year range, required fields)
  - Toast notifications on success/error

**Components**:

- `page.tsx`: Main page with table, search, filters, modal
- `Pagination.tsx`: Reusable pagination component
- `Toast.tsx`: Toast notification component

**Validation** (via `@tenderd-fms/core-types`):

```typescript
import { CreateVehicleSchema } from '@tenderd-fms/core-types';

const form = useForm({
  resolver: zodResolver(CreateVehicleSchema),
});
```

---

### 3️⃣ Maintenance (`/dashboard/maintenance`)

**Purpose**: Log and track vehicle maintenance

**Features**:

- **Maintenance Table**: Date, vehicle, type, status, cost
- **Filters**: Status (Scheduled/In-Progress/Completed), Date range
- **Create Maintenance Form**:
  - Select vehicle (dropdown with search)
  - Type: Routine, Repair, Inspection
  - Description (textarea)
  - Parts used (dynamic list with name, quantity, cost)
  - Labor hours + cost per hour
  - **Auto-calculated total cost** (parts + labor)
- **Update Maintenance**: Mark as completed/cancelled
- **Toast Notifications**: Success/error feedback

**Components**:

- `page.tsx`: Main page with table, filters, create/update forms
- `Pagination.tsx`
- `Toast.tsx`

**Dynamic Form Fields** (React Hook Form `useFieldArray`):

```typescript
const { fields, append, remove } = useFieldArray({
  control,
  name: 'parts',
});

// Add part button
<button onClick={() => append({ name: '', quantity: 1, cost: 0 })}>
  Add Part
</button>

// Render part fields
{fields.map((field, index) => (
  <input {...register(`parts.${index}.name`)} />
  <input {...register(`parts.${index}.quantity`)} type="number" />
  <input {...register(`parts.${index}.cost`)} type="number" step="0.01" />
  <button onClick={() => remove(index)}>Remove</button>
))}
```

---

### 4️⃣ Analytics (`/dashboard/analytics`)

**Purpose**: Visualize fleet performance metrics

**Features**:

- **Fleet Overview Cards**:
  - Total vehicles
  - Active vehicles (online count)
  - Distance traveled today (km)
  - Fuel consumed today (L)
- **Charts** (Recharts):
  - **Distance Traveled**: 7-day line chart
  - **Fuel Consumption**: Bar chart per vehicle
  - **Vehicle Type Distribution**: Pie chart
- **Data Quality Metrics**:
  - Validation issues count
  - Anomalies detected
  - Offline vehicle count

**Components**:

- `page.tsx`: Main analytics dashboard
- `components/CustomTooltip.tsx`: Custom chart tooltip styling

**Chart Example** (Recharts):

```typescript
<ResponsiveContainer width="100%" height={300}>
  <LineChart data={distanceData}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="date" />
    <YAxis />
    <Tooltip content={<CustomTooltip />} />
    <Line type="monotone" dataKey="distance" stroke="#10b981" strokeWidth={2} />
  </LineChart>
</ResponsiveContainer>
```

---

## 🎨 Styling & UI

### Tailwind CSS (Dark Mode)

**Color Palette**:

- **Background**: `bg-gray-900`, `bg-gray-800`
- **Text**: `text-gray-100`, `text-gray-300`
- **Borders**: `border-gray-700`
- **Accents**:
  - Green: `bg-emerald-500` (success, online)
  - Yellow: `bg-yellow-500` (warning, stale)
  - Red: `bg-red-500` (error, offline)
  - Blue: `bg-blue-500` (primary actions)

**Components**:

- **Buttons**: Gradient backgrounds with hover effects
  ```typescript
  className =
    'bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600';
  ```
- **Cards**: Rounded corners, subtle shadows
  ```typescript
  className = 'bg-gray-800 rounded-lg shadow-lg p-6';
  ```
- **Tables**: Striped rows, hover effects
  ```typescript
  className = 'even:bg-gray-800 hover:bg-gray-700';
  ```

### Icons (Heroicons)

```typescript
import {
  TruckIcon,
  WrenchIcon,
  ChartBarIcon,
  MapPinIcon,
  SignalIcon,
} from '@heroicons/react/24/outline';
```

---

## 🔌 API Integration

### API Client Setup

**`app/config/api.ts`:**

```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
export default API_URL;
```

### Fetch Pattern

```typescript
const response = await fetch(`${API_URL}/api/vehicle?page=${page}&limit=10`, {
  method: 'GET',
  headers: { 'Content-Type': 'application/json' },
});

const data = await response.json();

if (data.success) {
  setVehicles(data.data);
} else {
  setError(data.error);
}
```

### WebSocket Integration

**Using `@tenderd-fms/websocket-client`:**

```typescript
import { createWebSocketClient } from '@tenderd-fms/websocket-client';
import type { VehicleUpdateEvent } from '@tenderd-fms/core-types';

const client = createWebSocketClient(API_URL);

// Listen for telemetry updates
client.on('telemetry:update', (data: VehicleUpdateEvent) => {
  setVehicles(prev =>
    prev.map(v => (v._id === data.vehicleId ? { ...v, currentTelemetry: data.telemetry } : v)),
  );
});

// Connection state
client.onConnectionStateChange(change => {
  if (change.currentState === 'CONNECTED') {
    console.log('✅ WebSocket connected');
  }
});

// Cleanup
return () => client.destroy();
```

---

## 🗺️ Map Implementation (Leaflet)

### Custom Truck Icon Markers

**`MapView.tsx`:**

```typescript
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

function createCustomIcon(status: ConnectionStatus, isSelected: boolean) {
  const colors = {
    [ConnectionStatus.ONLINE]: { bg: '#10b981', ring: '#34d399' },
    [ConnectionStatus.STALE]: { bg: '#f59e0b', ring: '#fbbf24' },
    [ConnectionStatus.OFFLINE]: { bg: '#ef4444', ring: '#f87171' },
  };

  const color = colors[status];
  const size = isSelected ? 40 : 32;

  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <!-- Pulsing ring for selected -->
      ${isSelected ? `<animate attributeName="r" from="${size / 2}" to="${size / 2 + 8}" dur="1.5s" repeatCount="indefinite" />` : ''}
      
      <!-- Main circle -->
      <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="${color.bg}" stroke="white" stroke-width="3" />
      
      <!-- Truck icon -->
      <path d="..." fill="white" />
    </svg>
  `;

  return L.divIcon({
    html: svg,
    className: 'custom-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}
```

### Dynamic Import (Client-Side Only)

**`page.tsx`:**

```typescript
import dynamic from 'next/dynamic';

const MapView = dynamic(() => import('./MapView'), { ssr: false });
```

**Why?** Leaflet requires `window` object, which doesn't exist during SSR.

---

## 🧪 Form Validation

### Zod + React Hook Form

**Example: Vehicle Registration**

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateVehicleSchema } from '@tenderd-fms/core-types';

const form = useForm({
  resolver: zodResolver(CreateVehicleSchema),
  defaultValues: {
    vin: '',
    licensePlate: '',
    model: '',
    manufacturer: '',
    year: new Date().getFullYear(),
    type: 'TRUCK',
    fuelType: 'DIESEL',
    status: 'ACTIVE',
  },
});

const onSubmit = async (data) => {
  const response = await fetch(`${API_URL}/api/vehicle`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (result.success) {
    toast.success('Vehicle registered!');
    form.reset();
  } else {
    toast.error(result.error);
  }
};

<form onSubmit={form.handleSubmit(onSubmit)}>
  <input {...form.register('vin')} />
  {form.formState.errors.vin && <p>{form.formState.errors.vin.message}</p>}

  <button type="submit">Register Vehicle</button>
</form>
```

---

## 🚀 Environment Variables

**`.env.local`:**

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

**Production**:

```env
NEXT_PUBLIC_API_URL=https://api.tenderd-fms.com
```

---

## 🔧 Development

### Run Development Server

```bash
pnpm dev
```

Starts Next.js dev server at http://localhost:3000

### Build for Production

```bash
pnpm build
```

Creates optimized production build in `.next/`

### Start Production Server

```bash
pnpm start
```

Runs production build (requires `pnpm build` first)

---

## 📦 Dependencies

**Core**:

- `next` 15.x - React framework
- `react` 19.x
- `react-dom` 19.x
- `typescript` 5.x

**UI**:

- `tailwindcss` 3.x - Utility-first CSS
- `@heroicons/react` 2.x - Icons
- `recharts` 2.x - Charts
- `leaflet` + `react-leaflet` - Maps

**Forms**:

- `react-hook-form` 7.x
- `@hookform/resolvers` 3.x
- `zod` 3.x (from `@tenderd-fms/core-types`)

**WebSocket**:

- `@tenderd-fms/websocket-client` (workspace)
- `socket.io-client` 4.x

**Types**:

- `@tenderd-fms/core-types` (workspace)

---

## 📚 Additional Docs

- **Main README**: [../../README.md](../../README.md)
- **Backend API README**: [../api/README.md](../api/README.md)
- **IoT Transmitter README**: [../iot-transmitter/README.md](../iot-transmitter/README.md)

---

<div align="center">

**Part of [Tenderd Fleet Management System](../../README.md)**

</div>
