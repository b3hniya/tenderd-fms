'use client';

import { useState, useEffect } from 'react';
import { ConnectionBadge } from './components/ConnectionBadge';
import { Toast } from '../components/Toast';
import { AddVehicleModal } from './components/AddVehicleModal';
import { Pagination } from '../components/Pagination';

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchVin, setSearchVin] = useState('');
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
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (searchVin) {
        params.append('vin', searchVin);
      }

      const response = await fetch(`http://localhost:4000/api/vehicle?${params}`);
      const data = await response.json();

      if (data.success) {
        let vehiclesData: any[] = [];

        if (Array.isArray(data.data)) {
          vehiclesData = data.data;
        } else if (data.data) {
          vehiclesData = [data.data];
        }

        setVehicles(vehiclesData);

        if (data.pagination) {
          setTotal(data.pagination.total);
          setTotalPages(data.pagination.totalPages);
        } else {
          setTotal(vehiclesData.length);
          setTotalPages(1);
        }
      } else {
        setVehicles([]);
        setTotal(0);
        setTotalPages(1);
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      setVehicles([]);
      setTotal(0);
      setTotalPages(1);
      setToast({ show: true, message: 'Failed to fetch vehicles', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, [page, searchVin]);

  const handleSearch = (value: string) => {
    setSearchVin(value);
    setPage(1);
  };

  const handleAddSuccess = () => {
    setToast({ show: true, message: 'Vehicle created successfully!', type: 'success' });
    setPage(1);
    fetchVehicles();
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
          <h1 className="text-base font-semibold text-white">Vehicles</h1>
          <p className="mt-2 text-sm text-gray-400">
            A list of all vehicles in your fleet including their VIN, model, type, status, and
            connection status.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Add Vehicle
          </button>
        </div>
      </div>

      <div className="mt-4">
        <input
          type="text"
          placeholder="Search by VIN..."
          value={searchVin}
          onChange={e => handleSearch(e.target.value)}
          className="block w-full max-w-md rounded-md border-0 bg-white/5 px-3 py-1.5 text-white ring-1 ring-inset ring-white/10 placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm"
        />
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
                      VIN
                    </th>
                    <th
                      scope="col"
                      className="px-2 py-3.5 text-left text-sm font-semibold whitespace-nowrap text-white"
                    >
                      License Plate
                    </th>
                    <th
                      scope="col"
                      className="px-2 py-3.5 text-left text-sm font-semibold whitespace-nowrap text-white"
                    >
                      Model
                    </th>
                    <th
                      scope="col"
                      className="px-2 py-3.5 text-left text-sm font-semibold whitespace-nowrap text-white"
                    >
                      Manufacturer
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
                      Status
                    </th>
                    <th
                      scope="col"
                      className="px-2 py-3.5 text-left text-sm font-semibold whitespace-nowrap text-white"
                    >
                      Connection
                    </th>
                    <th scope="col" className="py-3.5 pr-4 pl-3 whitespace-nowrap sm:pr-0">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {vehicles.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-sm text-gray-400">
                        No vehicles found. Add your first vehicle to get started.
                      </td>
                    </tr>
                  ) : (
                    vehicles.map(vehicle => (
                      <tr key={vehicle._id}>
                        <td className="py-2 pr-3 pl-4 text-sm whitespace-nowrap text-gray-400 sm:pl-0">
                          {vehicle.vin}
                        </td>
                        <td className="px-2 py-2 text-sm font-medium whitespace-nowrap text-white">
                          {vehicle.licensePlate}
                        </td>
                        <td className="px-2 py-2 text-sm whitespace-nowrap text-white">
                          {vehicle.vehicleModel}
                        </td>
                        <td className="px-2 py-2 text-sm whitespace-nowrap text-gray-400">
                          {vehicle.manufacturer}
                        </td>
                        <td className="px-2 py-2 text-sm whitespace-nowrap text-gray-400">
                          {vehicle.type}
                        </td>
                        <td className="px-2 py-2 text-sm whitespace-nowrap text-gray-400">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                              vehicle.status === 'ACTIVE'
                                ? 'bg-green-500/10 text-green-400 ring-1 ring-inset ring-green-500/20'
                                : vehicle.status === 'MAINTENANCE'
                                  ? 'bg-yellow-500/10 text-yellow-400 ring-1 ring-inset ring-yellow-500/20'
                                  : 'bg-gray-500/10 text-gray-400 ring-1 ring-inset ring-gray-500/20'
                            }`}
                          >
                            {vehicle.status}
                          </span>
                        </td>
                        <td className="px-2 py-2 text-sm whitespace-nowrap text-gray-400">
                          <ConnectionBadge
                            status={vehicle.connectionStatus}
                            lastSeenAt={vehicle.lastSeenAt}
                          />
                        </td>
                        <td className="py-2 pr-4 pl-3 text-right text-sm font-medium whitespace-nowrap sm:pr-0">
                          <a href="#" className="text-indigo-400 hover:text-indigo-300">
                            View<span className="sr-only">, {vehicle.vin}</span>
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

      {!loading && vehicles.length > 0 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          total={total}
          limit={limit}
          onPageChange={setPage}
        />
      )}

      <AddVehicleModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={handleAddSuccess}
      />
    </div>
  );
}
