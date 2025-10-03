'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import {
  SignalIcon,
  SignalSlashIcon,
  MapPinIcon,
  ClockIcon,
  TruckIcon,
  XMarkIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { createWebSocketClient } from '@tenderd-fms/websocket-client';
import type {
  VehicleUpdateEvent,
  VehicleOfflineEvent,
  VehicleReconnectedEvent,
  VehicleStatusChangeEvent,
} from '@tenderd-fms/core-types';
import { ConnectionStatus } from '@tenderd-fms/core-types';

// Dynamically import map component (client-side only)
const MapView = dynamic(() => import('./MapView'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-gray-900">
      <div className="text-center">
        <div className="inline-block size-12 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent" />
        <p className="mt-4 text-sm text-gray-400">Loading map...</p>
      </div>
    </div>
  ),
});

// Vehicle interface
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

// Telemetry history point
interface TelemetryPoint {
  lat: number;
  lng: number;
  speed: number;
  timestamp: string;
}

// Toast notification
function Toast({
  show,
  message,
  type = 'info',
  onClose,
}: {
  show: boolean;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  onClose: () => void;
}) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(onClose, 5000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show) return null;

  const colors = {
    info: 'bg-blue-500/10 text-blue-300 outline-blue-500/20',
    success: 'bg-green-500/10 text-green-300 outline-green-500/20',
    warning: 'bg-yellow-500/10 text-yellow-300 outline-yellow-500/20',
    error: 'bg-red-500/10 text-red-300 outline-red-500/20',
  };

  return (
    <div className="fixed top-4 right-4 z-[9999] animate-in slide-in-from-top-2 duration-300">
      <div className={`rounded-md ${colors[type]} p-4 outline shadow-lg max-w-md`}>
        <div className="flex items-start">
          <div className="flex-1">
            <p className="text-sm font-medium">{message}</p>
          </div>
          <button onClick={onClose} className="ml-4 shrink-0 rounded-md p-1 hover:bg-white/10">
            <XMarkIcon className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Connection status indicator
function ConnectionIndicator({ isConnected }: { isConnected: boolean }) {
  return (
    <div className="flex items-center gap-2 rounded-md bg-gray-800 px-3 py-2 ring-1 ring-white/10">
      <div className="relative">
        {isConnected ? (
          <>
            <SignalIcon className="size-5 text-green-400" />
            <span className="absolute -top-1 -right-1 flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-green-500" />
            </span>
          </>
        ) : (
          <SignalSlashIcon className="size-5 text-red-400" />
        )}
      </div>
      <span className={`text-sm font-medium ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
        {isConnected ? 'Live' : 'Disconnected'}
      </span>
    </div>
  );
}

// Vehicle sidebar panel
function VehicleSidebar({
  vehicles,
  selectedVehicleId,
  onSelectVehicle,
}: {
  vehicles: Vehicle[];
  selectedVehicleId: string | null;
  onSelectVehicle: (vehicleId: string | null) => void;
}) {
  const getStatusColor = (status: ConnectionStatus) => {
    switch (status) {
      case ConnectionStatus.ONLINE:
        return 'text-green-400 bg-green-500/10';
      case ConnectionStatus.STALE:
        return 'text-yellow-400 bg-yellow-500/10';
      case ConnectionStatus.OFFLINE:
        return 'text-red-400 bg-red-500/10';
      default:
        return 'text-gray-400 bg-gray-500/10';
    }
  };

  const getStatusDot = (status: ConnectionStatus) => {
    switch (status) {
      case ConnectionStatus.ONLINE:
        return 'fill-green-500';
      case ConnectionStatus.STALE:
        return 'fill-yellow-500';
      case ConnectionStatus.OFFLINE:
        return 'fill-red-500';
      default:
        return 'fill-gray-500';
    }
  };

  const formatLastSeen = (lastSeenAt?: string) => {
    if (!lastSeenAt) return 'Never';
    const seconds = Math.floor((Date.now() - new Date(lastSeenAt).getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div className="flex h-full flex-col bg-gray-900 border-r border-white/10">
      {/* Header */}
      <div className="border-b border-white/10 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-white">Fleet</h2>
            <p className="text-sm text-gray-400">{vehicles.length} vehicles</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <svg className="size-2" viewBox="0 0 6 6">
                <circle r={3} cx={3} cy={3} className="fill-green-500" />
              </svg>
              <span className="text-xs text-gray-400">
                {vehicles.filter(v => v.connectionStatus === ConnectionStatus.ONLINE).length}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <svg className="size-2" viewBox="0 0 6 6">
                <circle r={3} cx={3} cy={3} className="fill-yellow-500" />
              </svg>
              <span className="text-xs text-gray-400">
                {vehicles.filter(v => v.connectionStatus === ConnectionStatus.STALE).length}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <svg className="size-2" viewBox="0 0 6 6">
                <circle r={3} cx={3} cy={3} className="fill-red-500" />
              </svg>
              <span className="text-xs text-gray-400">
                {vehicles.filter(v => v.connectionStatus === ConnectionStatus.OFFLINE).length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Vehicle list */}
      <div className="flex-1 overflow-y-auto">
        {vehicles.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center p-4">
            <div>
              <TruckIcon className="mx-auto size-12 text-gray-600" />
              <p className="mt-2 text-sm text-gray-400">No vehicles found</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {vehicles.map(vehicle => (
              <button
                key={vehicle._id}
                onClick={() =>
                  onSelectVehicle(vehicle._id === selectedVehicleId ? null : vehicle._id)
                }
                className={`w-full text-left p-4 hover:bg-white/5 transition-colors ${
                  vehicle._id === selectedVehicleId
                    ? 'bg-indigo-500/10 border-l-2 border-indigo-500'
                    : ''
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-white truncate">
                        {vehicle.licensePlate}
                      </p>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${getStatusColor(vehicle.connectionStatus)}`}
                      >
                        <svg className="size-1.5" viewBox="0 0 6 6">
                          <circle
                            r={3}
                            cx={3}
                            cy={3}
                            className={getStatusDot(vehicle.connectionStatus)}
                          />
                        </svg>
                        {vehicle.connectionStatus}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 truncate mt-1">
                      {vehicle.manufacturer} {vehicle.vehicleModel}
                    </p>
                    <p className="text-xs text-gray-500 truncate">VIN: {vehicle.vin}</p>
                    {vehicle.currentTelemetry && (
                      <div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <MapPinIcon className="size-3" />
                          {vehicle.currentTelemetry.speed.toFixed(0)} km/h
                        </span>
                        <span className="flex items-center gap-1">
                          <ClockIcon className="size-3" />
                          {formatLastSeen(vehicle.lastSeenAt)}
                        </span>
                      </div>
                    )}
                  </div>
                  {vehicle._id === selectedVehicleId && (
                    <ChevronRightIcon className="size-5 text-indigo-400 shrink-0" />
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function TrackingPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [vehiclePaths, setVehiclePaths] = useState<Record<string, TelemetryPoint[]>>({});
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
  }>({ show: false, message: '', type: 'info' });

  const wsClient = useRef<ReturnType<typeof createWebSocketClient> | null>(null);

  // Fetch initial vehicle data
  const fetchVehicles = useCallback(async () => {
    try {
      console.log('🚗 Fetching vehicles...');
      const response = await fetch('http://localhost:4000/api/vehicle?page=1&limit=1000');
      const data = await response.json();
      console.log('📦 Received vehicles data:', data);
      if (data.success) {
        const vehicleList = Array.isArray(data.data) ? data.data : [];
        console.log(
          `✅ Loaded ${vehicleList.length} vehicles:`,
          vehicleList.map((v: any) => ({ id: v._id, vin: v.vin, plate: v.licensePlate })),
        );
        setVehicles(vehicleList);
      }
    } catch (error) {
      console.error('❌ Error fetching vehicles:', error);
      setToast({
        show: true,
        message: 'Failed to load vehicles',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch telemetry history for a vehicle
  const fetchVehiclePath = useCallback(async (vehicleId: string) => {
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const response = await fetch(
        `http://localhost:4000/api/telemetry/history?vehicleId=${vehicleId}&startDate=${oneHourAgo}&limit=100`,
      );
      const data = await response.json();

      if (data.success && Array.isArray(data.data)) {
        const points: TelemetryPoint[] = data.data.map((t: any) => ({
          lat: t.location.lat,
          lng: t.location.lng,
          speed: t.speed,
          timestamp: t.timestamp,
        }));

        setVehiclePaths(prev => ({
          ...prev,
          [vehicleId]: points,
        }));
      }
    } catch (error) {
      console.error('Error fetching vehicle path:', error);
    }
  }, []);

  // Setup WebSocket connection
  useEffect(() => {
    fetchVehicles();

    // Create WebSocket client
    const client = createWebSocketClient('http://localhost:4000');
    wsClient.current = client;

    // Connection state tracking
    client.onConnectionStateChange(change => {
      console.log('🔌 WebSocket state change:', change);
      setIsConnected(change.currentState === 'CONNECTED');

      if (change.currentState === 'CONNECTED') {
        console.log('✅ WebSocket connected successfully');
        setToast({
          show: true,
          message: '🟢 Connected to real-time updates',
          type: 'success',
        });
      } else if (change.currentState === 'DISCONNECTED') {
        console.log('❌ WebSocket disconnected');
        setToast({
          show: true,
          message: '🔴 Lost connection to server',
          type: 'error',
        });
      }
    });

    // Listen for telemetry updates
    client.on('telemetry:update', (data: VehicleUpdateEvent) => {
      console.log('📡 Received telemetry update:', data);

      // Validate telemetry data
      if (!data?.telemetry?.location) {
        console.warn('❌ Received telemetry update without location data:', data);
        return;
      }

      console.log('✅ Valid telemetry update for vehicle:', data.vehicleId);

      setVehicles((prev: any) => {
        const updated = prev.map((v: any) =>
          v._id === data.vehicleId
            ? {
                ...v,
                connectionStatus: ConnectionStatus.ONLINE,
                lastSeenAt: new Date().toISOString(),
                currentTelemetry: {
                  location: data.telemetry.location,
                  speed: data.telemetry.speed,
                  fuelLevel: data.telemetry.fuelLevel,
                  engineTemp: data.telemetry.engineTemp,
                  odometer: data.telemetry.odometer,
                  timestamp: data.telemetry.timestamp,
                },
              }
            : v,
        );
        console.log(
          '🔄 Updated vehicles:',
          updated.filter((v: any) => v._id === data.vehicleId),
        );
        return updated;
      });

      // Add point to path
      setVehiclePaths((prev: any) => ({
        ...prev,
        [data.vehicleId]: [
          ...(prev[data.vehicleId] || []).slice(-99), // Keep last 100 points
          {
            lat: (data.telemetry.location as any).lat,
            lng: (data.telemetry.location as any).lng,
            speed: data.telemetry.speed,
            timestamp: data.telemetry.timestamp,
          },
        ],
      }));
    });

    // Listen for vehicle offline events
    client.on('vehicle:offline', (data: VehicleOfflineEvent) => {
      setVehicles(prev =>
        prev.map(v =>
          v._id === data.vehicleId ? { ...v, connectionStatus: ConnectionStatus.OFFLINE } : v,
        ),
      );

      const vehicle = vehicles.find(v => v._id === data.vehicleId);
      if (vehicle) {
        setToast({
          show: true,
          message: `🔴 ${vehicle.licensePlate} went offline`,
          type: 'warning',
        });
      }
    });

    // Listen for vehicle reconnected events
    client.on('vehicle:reconnected', (data: VehicleReconnectedEvent) => {
      setVehicles(prev =>
        prev.map(v =>
          v._id === data.vehicleId ? { ...v, connectionStatus: ConnectionStatus.ONLINE } : v,
        ),
      );

      const vehicle = vehicles.find(v => v._id === data.vehicleId);
      if (vehicle) {
        setToast({
          show: true,
          message: `🟢 ${vehicle.licensePlate} reconnected`,
          type: 'success',
        });
      }
    });

    // Listen for vehicle status change events (for STALE and other transitions)
    client.on('vehicle:status', (data: VehicleStatusChangeEvent) => {
      console.log('📊 Vehicle status changed:', data);

      setVehicles(prev =>
        prev.map(v => (v._id === data.vehicleId ? { ...v, connectionStatus: data.newStatus } : v)),
      );

      const vehicle = vehicles.find(v => v._id === data.vehicleId);
      if (vehicle) {
        const statusEmoji = {
          [ConnectionStatus.ONLINE]: '🟢',
          [ConnectionStatus.STALE]: '🟡',
          [ConnectionStatus.OFFLINE]: '🔴',
        };

        const statusLabel = {
          [ConnectionStatus.ONLINE]: 'Online',
          [ConnectionStatus.STALE]: 'Connection Stale',
          [ConnectionStatus.OFFLINE]: 'Offline',
        };

        const toastType = {
          [ConnectionStatus.ONLINE]: 'success' as const,
          [ConnectionStatus.STALE]: 'warning' as const,
          [ConnectionStatus.OFFLINE]: 'error' as const,
        };

        setToast({
          show: true,
          message: `${statusEmoji[data.newStatus]} ${vehicle.licensePlate} - ${statusLabel[data.newStatus]}`,
          type: toastType[data.newStatus],
        });
      }
    });

    return () => {
      client.destroy();
    };
  }, [fetchVehicles]);

  // Fetch path when vehicle is selected
  useEffect(() => {
    if (selectedVehicleId && !vehiclePaths[selectedVehicleId]) {
      fetchVehiclePath(selectedVehicleId);
    }
  }, [selectedVehicleId, vehiclePaths, fetchVehiclePath]);

  const selectedVehicle = vehicles.find(v => v._id === selectedVehicleId);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="inline-block size-12 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent" />
          <p className="mt-4 text-sm text-gray-400">Loading vehicles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, show: false })}
      />

      {/* Sidebar */}
      <div className="w-80 shrink-0">
        <VehicleSidebar
          vehicles={vehicles}
          selectedVehicleId={selectedVehicleId}
          onSelectVehicle={setSelectedVehicleId}
        />
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        {/* Connection indicator overlay */}
        <div className="absolute top-4 right-4 z-[1000]">
          <ConnectionIndicator isConnected={isConnected} />
        </div>

        <MapView
          vehicles={vehicles}
          selectedVehicle={selectedVehicle || null}
          vehiclePath={selectedVehicleId ? vehiclePaths[selectedVehicleId] || [] : []}
          onVehicleClick={setSelectedVehicleId}
        />
      </div>
    </div>
  );
}
