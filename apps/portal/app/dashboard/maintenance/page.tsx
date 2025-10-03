'use client';
import { Toast } from '../components/Toast';
import { TypeBadge } from './components/TypeBadge';
import { Pagination } from '../components/Pagination';
import { StatusBadge } from './components/StatusBadge';
import { useState, useEffect } from 'react';
import { MaintenanceStatus } from '@tenderd-fms/core-types';
import { CreateMaintenanceModal } from './components/MaintenanceModal';

export default function MaintenancePage() {
  const [maintenance, setMaintenance] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [filterVehicle, setFilterVehicle] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>(
    {
      show: false,
      message: '',
      type: 'success',
    },
  );
  const limit = 10;

  const fetchVehicles = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/vehicle?page=1&limit=1000');
      const data = await response.json();
      if (data.success) {
        setVehicles(Array.isArray(data.data) ? data.data : []);
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    }
  };

  const fetchMaintenance = async () => {
    try {
      setLoading(true);
      let url = `http://localhost:4000/api/maintenance?page=${page}&limit=${limit}`;

      if (filterVehicle) {
        url += `&vehicleId=${filterVehicle}`;
      }
      if (filterStatus) {
        url += `&status=${filterStatus}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        let maintenanceData: any[] = [];

        if (Array.isArray(data.data)) {
          maintenanceData = data.data;
        } else if (data.data) {
          maintenanceData = [data.data];
        }

        setMaintenance(maintenanceData);

        if (data.pagination) {
          setTotal(data.pagination.total);
          setTotalPages(data.pagination.totalPages);
        } else {
          setTotal(maintenanceData.length);
          setTotalPages(1);
        }
      } else {
        setMaintenance([]);
        setTotal(0);
        setTotalPages(1);
      }
    } catch (error) {
      console.error('Error fetching maintenance:', error);
      setMaintenance([]);
      setTotal(0);
      setTotalPages(1);
      setToast({ show: true, message: 'Failed to fetch maintenance records', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  useEffect(() => {
    fetchMaintenance();
  }, [page, filterVehicle, filterStatus]);

  const handleFilterChange = (vehicle: string, status: string) => {
    setFilterVehicle(vehicle);
    setFilterStatus(status);
    setPage(1);
  };

  const handleAddSuccess = () => {
    setToast({ show: true, message: 'Maintenance record created successfully!', type: 'success' });
    setPage(1);
    fetchMaintenance();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, show: false })}
      />

      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-base font-semibold text-white">Maintenance Records</h1>
          <p className="mt-2 text-sm text-gray-400">
            Track and manage all vehicle maintenance activities including scheduled services,
            repairs, and emergency maintenance.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Create Maintenance
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        <div>
          <label htmlFor="filterVehicle" className="block text-sm font-medium text-gray-400">
            Filter by Vehicle
          </label>
          <select
            id="filterVehicle"
            value={filterVehicle}
            onChange={e => handleFilterChange(e.target.value, filterStatus)}
            className="mt-1 block w-full rounded-md border-0 bg-white/5 px-3 py-2 text-white ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm"
          >
            <option value="" className="bg-gray-800">
              All Vehicles
            </option>
            {vehicles.map(vehicle => (
              <option key={vehicle._id} value={vehicle._id} className="bg-gray-800">
                {vehicle.vin} - {vehicle.licensePlate}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="filterStatus" className="block text-sm font-medium text-gray-400">
            Filter by Status
          </label>
          <select
            id="filterStatus"
            value={filterStatus}
            onChange={e => handleFilterChange(filterVehicle, e.target.value)}
            className="mt-1 block w-full rounded-md border-0 bg-white/5 px-3 py-2 text-white ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm"
          >
            <option value="" className="bg-gray-800">
              All Statuses
            </option>
            {Object.values(MaintenanceStatus).map(status => (
              <option key={status} value={status} className="bg-gray-800">
                {status}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
              </div>
            ) : (
              <table className="relative min-w-full divide-y divide-white/10">
                <thead>
                  <tr>
                    <th
                      scope="col"
                      className="py-3.5 pr-3 pl-4 text-left text-sm font-semibold whitespace-nowrap text-white sm:pl-0"
                    >
                      Vehicle
                    </th>
                    <th
                      scope="col"
                      className="px-2 py-3.5 text-left text-sm font-semibold whitespace-nowrap text-white"
                    >
                      Type
                    </th>
                    <th
                      scope="col"
                      className="px-2 py-3.5 text-left text-sm font-semibold whitespace-nowrap text-white"
                    >
                      Description
                    </th>
                    <th
                      scope="col"
                      className="px-2 py-3.5 text-left text-sm font-semibold whitespace-nowrap text-white"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className="px-2 py-3.5 text-left text-sm font-semibold whitespace-nowrap text-white"
                    >
                      Scheduled
                    </th>
                    <th
                      scope="col"
                      className="px-2 py-3.5 text-left text-sm font-semibold whitespace-nowrap text-white"
                    >
                      Odometer
                    </th>
                    <th
                      scope="col"
                      className="px-2 py-3.5 text-left text-sm font-semibold whitespace-nowrap text-white"
                    >
                      Total Cost
                    </th>
                    <th scope="col" className="py-3.5 pr-4 pl-3 whitespace-nowrap sm:pr-0">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {maintenance.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-sm text-gray-400">
                        No maintenance records found. Create your first record to get started.
                      </td>
                    </tr>
                  ) : (
                    maintenance.map(record => (
                      <tr key={record._id}>
                        <td className="py-2 pr-3 pl-4 text-sm whitespace-nowrap text-white sm:pl-0">
                          {record.vehicleId?.vin || 'N/A'}
                          <br />
                          <span className="text-xs text-gray-400">
                            {record.vehicleId?.licensePlate || ''}
                          </span>
                        </td>
                        <td className="px-2 py-2 text-sm whitespace-nowrap text-gray-400">
                          <TypeBadge type={record.type} />
                        </td>
                        <td className="px-2 py-2 text-sm text-white max-w-xs truncate">
                          {record.description}
                        </td>
                        <td className="px-2 py-2 text-sm whitespace-nowrap text-gray-400">
                          <StatusBadge status={record.status} />
                        </td>
                        <td className="px-2 py-2 text-sm whitespace-nowrap text-gray-400">
                          {formatDate(record.scheduledDate)}
                        </td>
                        <td className="px-2 py-2 text-sm whitespace-nowrap text-gray-400">
                          {record.odometer?.toLocaleString()} km
                        </td>
                        <td className="px-2 py-2 text-sm whitespace-nowrap text-gray-400">
                          ${record.totalCost?.toFixed(2) || '0.00'}
                        </td>
                        <td className="py-2 pr-4 pl-3 text-right text-sm font-medium whitespace-nowrap sm:pr-0">
                          <a href="#" className="text-indigo-400 hover:text-indigo-300">
                            View<span className="sr-only">, {record._id}</span>
                          </a>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {!loading && maintenance.length > 0 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          total={total}
          limit={limit}
          onPageChange={setPage}
        />
      )}

      <CreateMaintenanceModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={handleAddSuccess}
        vehicles={vehicles}
      />
    </div>
  );
}
