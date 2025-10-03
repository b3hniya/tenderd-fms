'use client';

import { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  TruckIcon,
  ClockIcon,
  FireIcon,
  BoltIcon,
  MapPinIcon,
  SignalIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { StatCard } from './components/StatCard';
import { LoadingSkeleton } from './components/LoadingSkeleton';
import { CustomTooltip } from './components/CustomTooltip';

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      // Calculate date range
      let startDate: Date | undefined;
      const endDate = new Date();

      if (dateRange !== 'all') {
        startDate = new Date();
        const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
        startDate.setDate(startDate.getDate() - days);
      }

      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate.toISOString());
      params.append('endDate', endDate.toISOString());

      const response = await fetch(`http://localhost:4000/api/analytics/fleet?${params}`);
      const data = await response.json();

      if (data.success) {
        setAnalytics(data.data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  if (loading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <LoadingSkeleton />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <ExclamationTriangleIcon className="mx-auto size-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-white">No data available</h3>
          <p className="mt-1 text-sm text-gray-400">
            Analytics data will appear once vehicles start reporting telemetry.
          </p>
        </div>
      </div>
    );
  }

  const { fleet, summary, vehicleBreakdown } = analytics;

  const fleetStatusData = [
    { name: 'Online', value: fleet.onlineVehicles, color: '#10b981' },
    { name: 'Offline', value: fleet.offlineVehicles, color: '#ef4444' },
    { name: 'Inactive', value: fleet.totalVehicles - fleet.activeVehicles, color: '#6b7280' },
  ];

  const topVehiclesData = vehicleBreakdown.slice(0, 10).map((v: any) => ({
    vehicleId: v.vehicleId.substring(0, 8),
    distance: Math.round(v.distanceTraveled),
    fuel: Math.round(v.fuelConsumed * 10) / 10,
    hours: Math.round(v.hoursOperated * 10) / 10,
  }));

  const utilizationData = [
    { name: 'Operating', value: summary.totalHoursOperated, color: '#3b82f6' },
    { name: 'Idle', value: summary.totalHoursIdle, color: '#f59e0b' },
  ];

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-base font-semibold text-white">Fleet Analytics</h1>
          <p className="mt-2 text-sm text-gray-400">
            Comprehensive insights into your fleet's performance and efficiency
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <select
            value={dateRange}
            onChange={e => setDateRange(e.target.value as any)}
            className="block rounded-md border-0 bg-gray-700 px-3 py-2 text-white ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="all">All time</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          name="Total Vehicles"
          value={fleet.totalVehicles}
          icon={TruckIcon}
          change={`${fleet.activeVehicles} active`}
          changeType="increase"
        />
        <StatCard
          name="Distance Traveled"
          value={`${Math.round(summary.totalDistanceTraveled).toLocaleString()} km`}
          icon={MapPinIcon}
        />
        <StatCard
          name="Hours Operated"
          value={Math.round(summary.totalHoursOperated).toLocaleString()}
          icon={ClockIcon}
        />
        <StatCard
          name="Fuel Consumed"
          value={`${Math.round(summary.totalFuelConsumed).toLocaleString()} L`}
          icon={FireIcon}
        />
      </div>

      {/* Secondary Metrics */}
      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          name="Online Vehicles"
          value={fleet.onlineVehicles}
          icon={SignalIcon}
          change={`${Math.round((fleet.onlineVehicles / fleet.totalVehicles) * 100)}%`}
          changeType="increase"
        />
        <StatCard
          name="Average Speed"
          value={`${Math.round(summary.averageSpeed)} km/h`}
          icon={BoltIcon}
        />
        <StatCard
          name="Fuel Efficiency"
          value={`${Math.round(summary.averageFuelEfficiency * 10) / 10} km/L`}
          icon={ChartBarIcon}
        />
        <StatCard
          name="Total Trips"
          value={summary.totalTrips.toLocaleString()}
          icon={MapPinIcon}
        />
      </div>

      {/* Charts Grid */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Fleet Status Chart */}
        <div className="overflow-hidden rounded-lg bg-gray-900 ring-1 ring-white/10">
          <div className="px-6 py-5 border-b border-white/10">
            <h3 className="text-base font-semibold text-white">Fleet Status</h3>
            <p className="mt-1 text-sm text-gray-400">Real-time vehicle connection status</p>
          </div>
          <div className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={fleetStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {fleetStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Utilization Chart */}
        <div className="overflow-hidden rounded-lg bg-gray-900 ring-1 ring-white/10">
          <div className="px-6 py-5 border-b border-white/10">
            <h3 className="text-base font-semibold text-white">Time Utilization</h3>
            <p className="mt-1 text-sm text-gray-400">Operating vs idle hours</p>
          </div>
          <div className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={utilizationData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }: any) => `${name}: ${Math.round(value)}h`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {utilizationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Vehicles by Distance */}
        <div className="overflow-hidden rounded-lg bg-gray-900 ring-1 ring-white/10 lg:col-span-2">
          <div className="px-6 py-5 border-b border-white/10">
            <h3 className="text-base font-semibold text-white">Top 10 Vehicles by Distance</h3>
            <p className="mt-1 text-sm text-gray-400">Most active vehicles in your fleet</p>
          </div>
          <div className="p-6">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={topVehiclesData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="vehicleId" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="distance" fill="#3b82f6" name="Distance (km)" radius={[8, 8, 0, 0]} />
                <Bar dataKey="fuel" fill="#f59e0b" name="Fuel (L)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="overflow-hidden rounded-lg bg-gray-900 ring-1 ring-white/10">
          <div className="px-6 py-5 border-b border-white/10">
            <h3 className="text-base font-semibold text-white">Performance Metrics</h3>
            <p className="mt-1 text-sm text-gray-400">Key performance indicators</p>
          </div>
          <div className="p-6 space-y-6">
            <div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Average Speed</span>
                <span className="font-semibold text-white">
                  {Math.round(summary.averageSpeed)} km/h
                </span>
              </div>
              <div className="mt-2 h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{
                    width: `${Math.min((summary.averageSpeed / summary.maxSpeed) * 100, 100)}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Max Speed</span>
                <span className="font-semibold text-white">
                  {Math.round(summary.maxSpeed)} km/h
                </span>
              </div>
              <div className="mt-2 h-2 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full" style={{ width: '100%' }} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Fuel Efficiency</span>
                <span className="font-semibold text-white">
                  {Math.round(summary.averageFuelEfficiency * 10) / 10} km/L
                </span>
              </div>
              <div className="mt-2 h-2 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full" style={{ width: '85%' }} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Data Quality</span>
                <span className="font-semibold text-white">
                  {Math.round(summary.overallDataQuality)}%
                </span>
              </div>
              <div className="mt-2 h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    summary.overallDataQuality >= 90
                      ? 'bg-green-500'
                      : summary.overallDataQuality >= 70
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                  }`}
                  style={{ width: `${summary.overallDataQuality}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Engine Temperature</span>
                <span className="font-semibold text-white">
                  {Math.round(summary.averageEngineTemp)}°C
                </span>
              </div>
              <div className="mt-2 h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    summary.averageEngineTemp < 90
                      ? 'bg-green-500'
                      : summary.averageEngineTemp < 100
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min((summary.averageEngineTemp / 120) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Vehicle Breakdown Table */}
        <div className="overflow-hidden rounded-lg bg-gray-900 ring-1 ring-white/10">
          <div className="px-6 py-5 border-b border-white/10">
            <h3 className="text-base font-semibold text-white">Vehicle Activity</h3>
            <p className="mt-1 text-sm text-gray-400">Individual vehicle performance</p>
          </div>
          <div className="overflow-auto max-h-96">
            <table className="min-w-full divide-y divide-white/10">
              <thead className="bg-gray-800/50 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Vehicle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Distance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Trips
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Quality
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {vehicleBreakdown.slice(0, 15).map((vehicle: any) => (
                  <tr key={vehicle.vehicleId} className="hover:bg-white/5">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      {vehicle.vehicleId.substring(0, 12)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {Math.round(vehicle.distanceTraveled).toLocaleString()} km
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {vehicle.trips}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                          vehicle.dataQuality >= 90
                            ? 'bg-green-500/10 text-green-400 ring-green-500/20'
                            : vehicle.dataQuality >= 70
                              ? 'bg-yellow-500/10 text-yellow-400 ring-yellow-500/20'
                              : 'bg-red-500/10 text-red-400 ring-red-500/20'
                        }`}
                      >
                        {Math.round(vehicle.dataQuality)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
