'use client';

import { useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  TruckIcon,
  SignalIcon,
  MapPinIcon,
  ClockIcon,
  FireIcon,
  BoltIcon,
} from '@heroicons/react/24/outline';
import { ConnectionStatus } from '@tenderd-fms/core-types';

// Fix Leaflet default icon issue with Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface Vehicle {
  _id: string;
  vin: string;
  licensePlate: string;
  manufacturer: string;
  vehicleModel: string;
  type: string;
  connectionStatus: ConnectionStatus;
  lastSeenAt?: string;
  currentTelemetry?: {
    location: { lat: number; lng: number };
    speed: number;
    fuelLevel: number;
    engineTemp: number;
    odometer: number;
    timestamp: string;
  };
}

interface TelemetryPoint {
  lat: number;
  lng: number;
  speed: number;
  timestamp: string;
}

interface MapViewProps {
  vehicles: Vehicle[];
  selectedVehicle: Vehicle | null;
  vehiclePath: TelemetryPoint[];
  onVehicleClick: (vehicleId: string) => void;
}

// Create custom markers
function createCustomIcon(status: ConnectionStatus, isSelected: boolean) {
  const colors = {
    [ConnectionStatus.ONLINE]: { bg: '#10b981', ring: '#34d399' },
    [ConnectionStatus.STALE]: { bg: '#f59e0b', ring: '#fbbf24' },
    [ConnectionStatus.OFFLINE]: { bg: '#ef4444', ring: '#f87171' },
  };

  const color = colors[status] || colors[ConnectionStatus.OFFLINE];
  const size = isSelected ? 40 : 32;
  const ringSize = isSelected ? 48 : 40;

  const svg = `
    <svg width="${ringSize}" height="${ringSize}" viewBox="0 0 ${ringSize} ${ringSize}" xmlns="http://www.w3.org/2000/svg">
      <!-- Pulsing ring for selected -->
      ${
        isSelected
          ? `<circle cx="${ringSize / 2}" cy="${ringSize / 2}" r="${ringSize / 2 - 2}" fill="none" stroke="${color.ring}" stroke-width="2" opacity="0.4">
        <animate attributeName="r" from="${size / 2}" to="${ringSize / 2 - 2}" dur="1.5s" repeatCount="indefinite" />
        <animate attributeName="opacity" from="0.6" to="0" dur="1.5s" repeatCount="indefinite" />
      </circle>`
          : ''
      }
      
      <!-- Main circle -->
      <circle cx="${ringSize / 2}" cy="${ringSize / 2}" r="${size / 2}" fill="${color.bg}" stroke="white" stroke-width="3" />
      
      <!-- Truck icon (Heroicon TruckIcon simplified) -->
      <g transform="translate(${ringSize / 2 - 10}, ${ringSize / 2 - 8})" fill="white" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M 2 4 L 2 12 L 4 12" fill="none"/>
        <path d="M 10 4 L 2 4 L 2 12 L 4 12" fill="none"/>
        <path d="M 10 4 L 12 4 L 15 8 L 15 12 L 13 12" fill="none"/>
        <path d="M 10 8 L 15 8" fill="none"/>
        <circle cx="5" cy="14" r="1.5"/>
        <circle cx="12" cy="14" r="1.5"/>
      </g>
    </svg>
  `;

  return L.divIcon({
    html: svg,
    className: 'custom-marker',
    iconSize: [ringSize, ringSize],
    iconAnchor: [ringSize / 2, ringSize / 2],
    popupAnchor: [0, -ringSize / 2],
  });
}

// Component to handle map bounds
function MapBounds({
  vehicles,
  selectedVehicle,
}: {
  vehicles: Vehicle[];
  selectedVehicle: Vehicle | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (selectedVehicle?.currentTelemetry?.location) {
      const { lat, lng } = selectedVehicle.currentTelemetry.location;
      if (!isNaN(lat) && !isNaN(lng)) {
        // Center on selected vehicle
        map.setView([lat, lng], 14, { animate: true, duration: 0.5 });
      }
    } else if (vehicles.length > 0) {
      // Fit all vehicles in view
      const bounds = vehicles
        .filter(
          v =>
            v.currentTelemetry?.location &&
            !isNaN(v.currentTelemetry.location.lat) &&
            !isNaN(v.currentTelemetry.location.lng),
        )
        .map(
          v =>
            [v.currentTelemetry!.location.lat, v.currentTelemetry!.location.lng] as [
              number,
              number,
            ],
        );

      if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
      }
    }
  }, [selectedVehicle, vehicles, map]);

  return null;
}

// Format time ago
function formatTimeAgo(timestamp?: string) {
  if (!timestamp) return 'Never';
  const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default function MapView({
  vehicles,
  selectedVehicle,
  vehiclePath,
  onVehicleClick,
}: MapViewProps) {
  // Calculate center and zoom based on vehicles
  const mapCenter = useMemo((): [number, number] => {
    if (selectedVehicle?.currentTelemetry?.location) {
      const { lat, lng } = selectedVehicle.currentTelemetry.location;
      if (!isNaN(lat) && !isNaN(lng)) {
        return [lat, lng];
      }
    }

    const vehiclesWithLocation = vehicles.filter(
      v =>
        v.currentTelemetry?.location &&
        !isNaN(v.currentTelemetry.location.lat) &&
        !isNaN(v.currentTelemetry.location.lng),
    );

    if (vehiclesWithLocation.length === 0) {
      return [25.2048, 55.2708]; // Dubai default
    }

    const avgLat =
      vehiclesWithLocation.reduce((sum, v) => sum + v.currentTelemetry!.location.lat, 0) /
      vehiclesWithLocation.length;
    const avgLng =
      vehiclesWithLocation.reduce((sum, v) => sum + v.currentTelemetry!.location.lng, 0) /
      vehiclesWithLocation.length;

    if (isNaN(avgLat) || isNaN(avgLng)) {
      return [25.2048, 55.2708]; // Dubai default fallback
    }

    return [avgLat, avgLng];
  }, [vehicles, selectedVehicle]);

  // Generate path line coordinates
  const pathCoordinates = useMemo(() => {
    if (!vehiclePath || vehiclePath.length === 0) return [];
    return vehiclePath.map(point => [point.lat, point.lng] as [number, number]);
  }, [vehiclePath]);

  // Get path color based on speed (gradient from blue to red)
  const getPathColor = () => {
    return '#818cf8'; // Indigo color
  };

  return (
    <MapContainer
      center={mapCenter}
      zoom={12}
      className="h-full w-full"
      zoomControl={true}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        className="map-tiles"
      />

      <MapBounds vehicles={vehicles} selectedVehicle={selectedVehicle} />

      {/* Draw vehicle path */}
      {pathCoordinates.length > 1 && (
        <Polyline
          positions={pathCoordinates}
          pathOptions={{
            color: getPathColor(),
            weight: 4,
            opacity: 0.7,
            lineCap: 'round',
            lineJoin: 'round',
          }}
        />
      )}

      {/* Vehicle markers */}
      {vehicles.map(vehicle => {
        if (!vehicle.currentTelemetry?.location) return null;

        const { lat, lng } = vehicle.currentTelemetry.location;
        if (isNaN(lat) || isNaN(lng)) return null;

        const isSelected = selectedVehicle?._id === vehicle._id;
        const icon = createCustomIcon(vehicle.connectionStatus, isSelected);

        return (
          <Marker
            key={vehicle._id}
            position={[lat, lng]}
            icon={icon}
            eventHandlers={{
              click: () => onVehicleClick(vehicle._id),
            }}
            zIndexOffset={isSelected ? 1000 : 0}
          >
            <Popup className="custom-popup" maxWidth={300}>
              <div className="p-2">
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                      {vehicle.licensePlate}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {vehicle.manufacturer} {vehicle.vehicleModel}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      VIN: {vehicle.vin}
                    </p>
                  </div>
                  <div className="shrink-0">
                    {vehicle.connectionStatus === ConnectionStatus.ONLINE && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 dark:bg-green-500/10 px-2 py-1 text-xs font-medium text-green-700 dark:text-green-400">
                        <svg className="size-1.5" viewBox="0 0 6 6">
                          <circle r={3} cx={3} cy={3} className="fill-green-500" />
                        </svg>
                        Online
                      </span>
                    )}
                    {vehicle.connectionStatus === ConnectionStatus.STALE && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 dark:bg-yellow-500/10 px-2 py-1 text-xs font-medium text-yellow-700 dark:text-yellow-400">
                        <svg className="size-1.5" viewBox="0 0 6 6">
                          <circle r={3} cx={3} cy={3} className="fill-yellow-500" />
                        </svg>
                        Stale
                      </span>
                    )}
                    {vehicle.connectionStatus === ConnectionStatus.OFFLINE && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 dark:bg-red-500/10 px-2 py-1 text-xs font-medium text-red-700 dark:text-red-400">
                        <svg className="size-1.5" viewBox="0 0 6 6">
                          <circle r={3} cx={3} cy={3} className="fill-red-500" />
                        </svg>
                        Offline
                      </span>
                    )}
                  </div>
                </div>

                {/* Telemetry data */}
                {vehicle.currentTelemetry && (
                  <div className="space-y-2 border-t border-gray-200 dark:border-gray-700 pt-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <MapPinIcon className="size-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Speed</div>
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {vehicle.currentTelemetry.speed.toFixed(0)} km/h
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <BoltIcon className="size-4 text-blue-600 dark:text-blue-400 shrink-0" />
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Fuel</div>
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {vehicle.currentTelemetry.fuelLevel.toFixed(0)}%
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <FireIcon className="size-4 text-orange-600 dark:text-orange-400 shrink-0" />
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Engine</div>
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {vehicle.currentTelemetry.engineTemp.toFixed(0)}°C
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <ClockIcon className="size-4 text-gray-600 dark:text-gray-400 shrink-0" />
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Last seen</div>
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {formatTimeAgo(vehicle.lastSeenAt)}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700">
                      Odometer: {vehicle.currentTelemetry.odometer.toFixed(1)} km
                    </div>
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}

      {/* Custom CSS for popup */}
      <style jsx global>{`
        .custom-marker {
          background: transparent;
          border: none;
        }

        .leaflet-popup-content-wrapper {
          background: rgba(17, 24, 39, 0.95);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 0.5rem;
          padding: 0;
        }

        .leaflet-popup-content {
          margin: 0;
          width: auto !important;
        }

        .leaflet-popup-tip {
          background: rgba(17, 24, 39, 0.95);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-top: none;
          border-right: none;
        }

        .leaflet-container a.leaflet-popup-close-button {
          color: #9ca3af;
          font-size: 20px;
          padding: 8px 8px 0 0;
        }

        .leaflet-container a.leaflet-popup-close-button:hover {
          color: #fff;
        }

        /* Dark mode for tiles */
        .map-tiles {
          filter: brightness(0.9) contrast(1.1) saturate(0.8);
        }
      `}</style>
    </MapContainer>
  );
}
