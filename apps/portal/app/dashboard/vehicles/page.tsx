'use client';

import { useState, useEffect, Fragment } from 'react';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import {
  CheckCircleIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/20/solid';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  CreateVehicleRequestSchema,
  VehicleType,
  FuelType,
  VehicleStatus,
} from '@tenderd-fms/core-types';
import type { CreateVehicleRequest } from '@tenderd-fms/core-types';

// Connection status badge component
function ConnectionBadge({ status, lastSeenAt }: { status: string; lastSeenAt?: string }) {
  const isOnline = status === 'ONLINE';
  const isOffline = status === 'OFFLINE';

  return (
    <span className="inline-flex items-center gap-x-1.5 rounded-full px-2 py-1 text-xs font-medium">
      <svg
        viewBox="0 0 6 6"
        aria-hidden="true"
        className={`size-1.5 ${isOnline ? 'fill-green-500' : isOffline ? 'fill-red-500' : 'fill-yellow-500'}`}
      >
        <circle r={3} cx={3} cy={3} />
      </svg>
      <span
        className={isOnline ? 'text-green-400' : isOffline ? 'text-red-400' : 'text-yellow-400'}
      >
        {isOnline ? 'Online' : isOffline ? 'Offline' : 'Stale'}
      </span>
    </span>
  );
}

// Toast notification component
function Toast({
  show,
  message,
  type = 'success',
  onClose,
}: {
  show: boolean;
  message: string;
  type?: 'success' | 'error';
  onClose: () => void;
}) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(onClose, 5000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show) return null;

  const isSuccess = type === 'success';

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300">
      <div
        className={`rounded-md ${isSuccess ? 'bg-green-500/10' : 'bg-red-500/10'} p-4 outline ${isSuccess ? 'outline-green-500/20' : 'outline-red-500/20'}`}
      >
        <div className="flex">
          <div className="shrink-0">
            {isSuccess ? (
              <CheckCircleIcon aria-hidden="true" className="size-5 text-green-400" />
            ) : (
              <XMarkIcon aria-hidden="true" className="size-5 text-red-400" />
            )}
          </div>
          <div className="ml-3">
            <p className={`text-sm font-medium ${isSuccess ? 'text-green-300' : 'text-red-300'}`}>
              {message}
            </p>
          </div>
          <div className="ml-auto pl-3">
            <div className="-mx-1.5 -my-1.5">
              <button
                type="button"
                onClick={onClose}
                className={`inline-flex rounded-md p-1.5 ${isSuccess ? 'text-green-400 hover:bg-green-500/10 focus-visible:ring-green-500 focus-visible:ring-offset-green-900' : 'text-red-400 hover:bg-red-500/10 focus-visible:ring-red-500 focus-visible:ring-offset-red-900'} focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:outline-hidden`}
              >
                <span className="sr-only">Dismiss</span>
                <XMarkIcon aria-hidden="true" className="size-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Add Vehicle Modal
function AddVehicleModal({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateVehicleRequest>({
    resolver: zodResolver(CreateVehicleRequestSchema),
    defaultValues: {
      status: VehicleStatus.ACTIVE,
    },
  });

  const onSubmit = async (data: CreateVehicleRequest) => {
    try {
      const response = await fetch('http://localhost:4000/api/vehicle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to create vehicle');
      }

      reset();
      onClose();
      onSuccess();
    } catch (error) {
      console.error('Error creating vehicle:', error);
      throw error;
    }
  };

  return (
    <Transition show={open} as={Fragment}>
      <Dialog onClose={onClose} className="relative z-50">
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500/75 transition-opacity" />
        </TransitionChild>

        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <DialogPanel className="relative transform overflow-hidden rounded-lg bg-gray-900 px-4 pb-4 pt-5 text-left shadow-xl ring-1 ring-white/10 transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6">
                <div className="absolute right-0 top-0 pr-4 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-md bg-gray-900 text-gray-400 hover:text-gray-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="size-6" aria-hidden="true" />
                  </button>
                </div>

                <div className="sm:flex sm:items-start">
                  <div className="mt-3 w-full text-center sm:mt-0 sm:text-left">
                    <DialogTitle as="h3" className="text-base font-semibold text-white">
                      Add New Vehicle
                    </DialogTitle>
                    <div className="mt-6">
                      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
                          {/* VIN */}
                          <div className="sm:col-span-2">
                            <label htmlFor="vin" className="block text-sm font-medium text-white">
                              VIN <span className="text-red-400">*</span>
                            </label>
                            <input
                              {...register('vin')}
                              type="text"
                              className="mt-2 block w-full rounded-md border-0 bg-white/5 px-3 py-1.5 text-white ring-1 ring-inset ring-white/10 placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm"
                              placeholder="1HGBH41JXMN109186"
                            />
                            {errors.vin && (
                              <p className="mt-1 text-sm text-red-400">{errors.vin.message}</p>
                            )}
                          </div>

                          {/* License Plate */}
                          <div>
                            <label
                              htmlFor="licensePlate"
                              className="block text-sm font-medium text-white"
                            >
                              License Plate <span className="text-red-400">*</span>
                            </label>
                            <input
                              {...register('licensePlate')}
                              type="text"
                              className="mt-2 block w-full rounded-md border-0 bg-white/5 px-3 py-1.5 text-white ring-1 ring-inset ring-white/10 placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm"
                              placeholder="ABC-1234"
                            />
                            {errors.licensePlate && (
                              <p className="mt-1 text-sm text-red-400">
                                {errors.licensePlate.message}
                              </p>
                            )}
                          </div>

                          {/* Model */}
                          <div>
                            <label
                              htmlFor="vehicleModel"
                              className="block text-sm font-medium text-white"
                            >
                              Model <span className="text-red-400">*</span>
                            </label>
                            <input
                              {...register('vehicleModel')}
                              type="text"
                              className="mt-2 block w-full rounded-md border-0 bg-white/5 px-3 py-1.5 text-white ring-1 ring-inset ring-white/10 placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm"
                              placeholder="F-150"
                            />
                            {errors.vehicleModel && (
                              <p className="mt-1 text-sm text-red-400">
                                {errors.vehicleModel.message}
                              </p>
                            )}
                          </div>

                          {/* Manufacturer */}
                          <div>
                            <label
                              htmlFor="manufacturer"
                              className="block text-sm font-medium text-white"
                            >
                              Manufacturer <span className="text-red-400">*</span>
                            </label>
                            <input
                              {...register('manufacturer')}
                              type="text"
                              className="mt-2 block w-full rounded-md border-0 bg-white/5 px-3 py-1.5 text-white ring-1 ring-inset ring-white/10 placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm"
                              placeholder="Ford"
                            />
                            {errors.manufacturer && (
                              <p className="mt-1 text-sm text-red-400">
                                {errors.manufacturer.message}
                              </p>
                            )}
                          </div>

                          {/* Year */}
                          <div>
                            <label htmlFor="year" className="block text-sm font-medium text-white">
                              Year <span className="text-red-400">*</span>
                            </label>
                            <input
                              {...register('year', { valueAsNumber: true })}
                              type="number"
                              className="mt-2 block w-full rounded-md border-0 bg-white/5 px-3 py-1.5 text-white ring-1 ring-inset ring-white/10 placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm"
                              placeholder="2024"
                            />
                            {errors.year && (
                              <p className="mt-1 text-sm text-red-400">{errors.year.message}</p>
                            )}
                          </div>

                          {/* Type */}
                          <div>
                            <label htmlFor="type" className="block text-sm font-medium text-white">
                              Type <span className="text-red-400">*</span>
                            </label>
                            <select
                              {...register('type')}
                              className="mt-2 block w-full rounded-md border-0 bg-white/5 px-3 py-2 text-white ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm"
                            >
                              <option value="" className="bg-gray-800">
                                Select type
                              </option>
                              {Object.values(VehicleType).map(type => (
                                <option key={type} value={type} className="bg-gray-800">
                                  {type}
                                </option>
                              ))}
                            </select>
                            {errors.type && (
                              <p className="mt-1 text-sm text-red-400">{errors.type.message}</p>
                            )}
                          </div>

                          {/* Fuel Type */}
                          <div>
                            <label
                              htmlFor="fuelType"
                              className="block text-sm font-medium text-white"
                            >
                              Fuel Type <span className="text-red-400">*</span>
                            </label>
                            <select
                              {...register('fuelType')}
                              className="mt-2 block w-full rounded-md border-0 bg-white/5 px-3 py-2 text-white ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm"
                            >
                              <option value="" className="bg-gray-800">
                                Select fuel type
                              </option>
                              {Object.values(FuelType).map(fuel => (
                                <option key={fuel} value={fuel} className="bg-gray-800">
                                  {fuel}
                                </option>
                              ))}
                            </select>
                            {errors.fuelType && (
                              <p className="mt-1 text-sm text-red-400">{errors.fuelType.message}</p>
                            )}
                          </div>

                          {/* Status */}
                          <div>
                            <label
                              htmlFor="status"
                              className="block text-sm font-medium text-white"
                            >
                              Status
                            </label>
                            <select
                              {...register('status')}
                              className="mt-2 block w-full rounded-md border-0 bg-white/5 px-3 py-2 text-white ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm"
                            >
                              {Object.values(VehicleStatus).map(status => (
                                <option key={status} value={status} className="bg-gray-800">
                                  {status}
                                </option>
                              ))}
                            </select>
                            {errors.status && (
                              <p className="mt-1 text-sm text-red-400">{errors.status.message}</p>
                            )}
                          </div>
                        </div>

                        <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                          <button
                            type="submit"
                            disabled={isSubmitting}
                            className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed sm:ml-3 sm:w-auto"
                          >
                            {isSubmitting ? 'Creating...' : 'Create Vehicle'}
                          </button>
                          <button
                            type="button"
                            onClick={onClose}
                            className="mt-3 inline-flex w-full justify-center rounded-md bg-white/10 px-3 py-2 text-sm font-semibold text-white ring-1 ring-inset ring-white/10 shadow-xs hover:bg-white/20 sm:mt-0 sm:w-auto"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

// Pagination component
function Pagination({
  currentPage,
  totalPages,
  total,
  limit,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
}) {
  const startItem = (currentPage - 1) * limit + 1;
  const endItem = Math.min(currentPage * limit, total);

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, '...', totalPages - 1, totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, 2, '...', totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="flex items-center justify-between border-t border-white/10 px-4 py-3 sm:px-6">
      <div className="flex flex-1 justify-between sm:hidden">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="relative inline-flex items-center rounded-md border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-gray-200 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="relative ml-3 inline-flex items-center rounded-md border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-gray-200 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-300">
            Showing <span className="font-medium">{startItem}</span> to{' '}
            <span className="font-medium">{endItem}</span> of{' '}
            <span className="font-medium">{total}</span> results
          </p>
        </div>
        <div>
          <nav aria-label="Pagination" className="isolate inline-flex -space-x-px rounded-md">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 inset-ring inset-ring-gray-700 hover:bg-white/5 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="sr-only">Previous</span>
              <ChevronLeftIcon aria-hidden="true" className="size-5" />
            </button>
            {getPageNumbers().map((page, idx) =>
              page === '...' ? (
                <span
                  key={`ellipsis-${idx}`}
                  className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-400 inset-ring inset-ring-gray-700 focus:outline-offset-0"
                >
                  ...
                </span>
              ) : (
                <button
                  key={page}
                  onClick={() => onPageChange(page as number)}
                  className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                    currentPage === page
                      ? 'z-10 bg-indigo-500 text-white focus:z-20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500'
                      : 'text-gray-200 inset-ring inset-ring-gray-700 hover:bg-white/5 focus:z-20 focus:outline-offset-0'
                  }`}
                >
                  {page}
                </button>
              ),
            )}
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 inset-ring inset-ring-gray-700 hover:bg-white/5 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="sr-only">Next</span>
              <ChevronRightIcon aria-hidden="true" className="size-5" />
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
}

// Main component
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
        // Handle both single object and array responses
        let vehiclesData: any[] = [];

        if (Array.isArray(data.data)) {
          // Array response (paginated list)
          vehiclesData = data.data;
        } else if (data.data) {
          // Single object response (search by VIN/ID)
          vehiclesData = [data.data];
        }

        setVehicles(vehiclesData);

        // Use pagination if available, otherwise calculate from results
        if (data.pagination) {
          setTotal(data.pagination.total);
          setTotalPages(data.pagination.totalPages);
        } else {
          // Single result from search
          setTotal(vehiclesData.length);
          setTotalPages(1);
        }
      } else {
        // Handle unsuccessful response
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
