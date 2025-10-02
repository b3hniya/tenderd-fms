'use client';

import { useState, useEffect, Fragment } from 'react';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import {
  CheckCircleIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/20/solid';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  CreateMaintenanceRequestSchema,
  UpdateMaintenanceRequestSchema,
  MaintenanceType,
  MaintenanceStatus,
} from '@tenderd-fms/core-types';
import type {
  CreateMaintenanceRequest,
  UpdateMaintenanceRequest,
  MaintenancePart,
} from '@tenderd-fms/core-types';

// Combined form type for creating maintenance with all fields
interface MaintenanceFormData extends CreateMaintenanceRequest {
  status: MaintenanceStatus;
  parts: MaintenancePart[];
  laborCost: number;
  scheduledDate: string; // datetime-local uses string
  odometer: number;
}

// Status badge component
function StatusBadge({ status }: { status: string }) {
  const getStatusColor = () => {
    switch (status) {
      case 'SCHEDULED':
        return 'bg-blue-500/10 text-blue-400 ring-blue-500/20';
      case 'IN_PROGRESS':
        return 'bg-yellow-500/10 text-yellow-400 ring-yellow-500/20';
      case 'COMPLETED':
        return 'bg-green-500/10 text-green-400 ring-green-500/20';
      case 'CANCELLED':
        return 'bg-red-500/10 text-red-400 ring-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 ring-gray-500/20';
    }
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${getStatusColor()}`}
    >
      {status}
    </span>
  );
}

// Type badge component
function TypeBadge({ type }: { type: string }) {
  const getTypeColor = () => {
    switch (type) {
      case 'EMERGENCY':
        return 'bg-red-500/10 text-red-400 ring-red-500/20';
      case 'PREVENTIVE':
        return 'bg-blue-500/10 text-blue-400 ring-blue-500/20';
      case 'SCHEDULED':
        return 'bg-green-500/10 text-green-400 ring-green-500/20';
      case 'REPAIR':
        return 'bg-yellow-500/10 text-yellow-400 ring-yellow-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 ring-gray-500/20';
    }
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${getTypeColor()}`}
    >
      {type}
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

// Create Maintenance Modal
function CreateMaintenanceModal({
  open,
  onClose,
  onSuccess,
  vehicles,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  vehicles: any[];
}) {
  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<MaintenanceFormData>({
    defaultValues: {
      status: MaintenanceStatus.SCHEDULED,
      parts: [],
      laborCost: 0,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'parts',
  });

  const parts = watch('parts') || [];
  const laborCost = watch('laborCost') || 0;

  const totalPartsCost = parts.reduce((sum, part) => {
    const cost = (part?.cost || 0) * (part?.quantity || 0);
    return sum + cost;
  }, 0);

  const totalCost = totalPartsCost + laborCost;

  const onSubmit = async (data: MaintenanceFormData) => {
    try {
      // Map frontend form data to backend API format
      const payload = {
        vehicleId: data.vehicleId,
        type: data.type,
        title: data.description || 'Maintenance', // Use description as title
        description: data.description,
        scheduledAt: data.scheduledDate ? new Date(data.scheduledDate).toISOString() : undefined,
        mechanicName: data.mechanicName,
        odometerReading: data.odometer,
        notes: data.parts?.length
          ? `Parts: ${data.parts.map(p => `${p.name} (${p.quantity}x $${p.cost})`).join(', ')}. Labor Cost: $${data.laborCost || 0}. Total: $${totalCost.toFixed(2)}`
          : undefined,
      };

      const response = await fetch('http://localhost:4000/api/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Backend error:', error);
        throw new Error(error.error || 'Failed to create maintenance record');
      }

      reset();
      onClose();
      onSuccess();
    } catch (error) {
      console.error('Error creating maintenance:', error);
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
              <DialogPanel className="relative transform overflow-hidden rounded-lg bg-gray-900 px-4 pb-4 pt-5 text-left shadow-xl ring-1 ring-white/10 transition-all sm:my-8 sm:w-full sm:max-w-3xl sm:p-6">
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
                      Create Maintenance Record
                    </DialogTitle>
                    <div className="mt-6">
                      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
                          {/* Vehicle */}
                          <div className="sm:col-span-2">
                            <label
                              htmlFor="vehicleId"
                              className="block text-sm font-medium text-white"
                            >
                              Vehicle <span className="text-red-400">*</span>
                            </label>
                            <select
                              {...register('vehicleId')}
                              className="mt-2 block w-full rounded-md border-0 bg-white/5 px-3 py-2 text-white ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm"
                            >
                              <option value="" className="bg-gray-800">
                                Select vehicle
                              </option>
                              {vehicles.map(vehicle => (
                                <option
                                  key={vehicle._id}
                                  value={vehicle._id}
                                  className="bg-gray-800"
                                >
                                  {vehicle.vin} - {vehicle.licensePlate}
                                </option>
                              ))}
                            </select>
                            {errors.vehicleId && (
                              <p className="mt-1 text-sm text-red-400">
                                {errors.vehicleId.message}
                              </p>
                            )}
                          </div>

                          {/* Type */}
                          <div>
                            <label htmlFor="type" className="block text-sm font-medium text-white">
                              Maintenance Type <span className="text-red-400">*</span>
                            </label>
                            <select
                              {...register('type')}
                              className="mt-2 block w-full rounded-md border-0 bg-white/5 px-3 py-2 text-white ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm"
                            >
                              <option value="" className="bg-gray-800">
                                Select type
                              </option>
                              {Object.values(MaintenanceType).map(type => (
                                <option key={type} value={type} className="bg-gray-800">
                                  {type}
                                </option>
                              ))}
                            </select>
                            {errors.type && (
                              <p className="mt-1 text-sm text-red-400">{errors.type.message}</p>
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
                              {Object.values(MaintenanceStatus).map(status => (
                                <option key={status} value={status} className="bg-gray-800">
                                  {status}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Description */}
                          <div className="sm:col-span-2">
                            <label
                              htmlFor="description"
                              className="block text-sm font-medium text-white"
                            >
                              Description <span className="text-red-400">*</span>
                            </label>
                            <textarea
                              {...register('description')}
                              rows={3}
                              className="mt-2 block w-full rounded-md border-0 bg-white/5 px-3 py-1.5 text-white ring-1 ring-inset ring-white/10 placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm"
                              placeholder="Describe the maintenance work..."
                            />
                            {errors.description && (
                              <p className="mt-1 text-sm text-red-400">
                                {errors.description.message}
                              </p>
                            )}
                          </div>

                          {/* Scheduled Date */}
                          <div>
                            <label
                              htmlFor="scheduledDate"
                              className="block text-sm font-medium text-white"
                            >
                              Scheduled Date <span className="text-red-400">*</span>
                            </label>
                            <input
                              {...register('scheduledDate')}
                              type="datetime-local"
                              className="mt-2 block w-full rounded-md border-0 bg-white/5 px-3 py-1.5 text-white ring-1 ring-inset ring-white/10 placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm"
                            />
                            {errors.scheduledDate && (
                              <p className="mt-1 text-sm text-red-400">
                                {errors.scheduledDate.message}
                              </p>
                            )}
                          </div>

                          {/* Odometer */}
                          <div>
                            <label
                              htmlFor="odometer"
                              className="block text-sm font-medium text-white"
                            >
                              Odometer (km) <span className="text-red-400">*</span>
                            </label>
                            <input
                              {...register('odometer', { valueAsNumber: true })}
                              type="number"
                              className="mt-2 block w-full rounded-md border-0 bg-white/5 px-3 py-1.5 text-white ring-1 ring-inset ring-white/10 placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm"
                              placeholder="0"
                            />
                            {errors.odometer && (
                              <p className="mt-1 text-sm text-red-400">{errors.odometer.message}</p>
                            )}
                          </div>

                          {/* Mechanic Name */}
                          <div className="sm:col-span-2">
                            <label
                              htmlFor="mechanicName"
                              className="block text-sm font-medium text-white"
                            >
                              Mechanic Name
                            </label>
                            <input
                              {...register('mechanicName')}
                              type="text"
                              className="mt-2 block w-full rounded-md border-0 bg-white/5 px-3 py-1.5 text-white ring-1 ring-inset ring-white/10 placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm"
                              placeholder="John Doe"
                            />
                          </div>

                          {/* Parts */}
                          <div className="sm:col-span-2">
                            <div className="flex items-center justify-between">
                              <label className="block text-sm font-medium text-white">Parts</label>
                              <button
                                type="button"
                                onClick={() => append({ name: '', quantity: 1, cost: 0 })}
                                className="inline-flex items-center gap-x-1.5 rounded-md bg-indigo-600 px-2.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-500"
                              >
                                <PlusIcon className="-ml-0.5 size-4" aria-hidden="true" />
                                Add Part
                              </button>
                            </div>
                            <div className="mt-2 space-y-3">
                              {fields.map((field, index) => (
                                <div key={field.id} className="grid grid-cols-12 gap-2">
                                  <div className="col-span-5">
                                    <input
                                      {...register(`parts.${index}.name` as const)}
                                      placeholder="Part name"
                                      className="block w-full rounded-md border-0 bg-white/5 px-3 py-1.5 text-white ring-1 ring-inset ring-white/10 placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm"
                                    />
                                  </div>
                                  <div className="col-span-3">
                                    <input
                                      {...register(`parts.${index}.quantity` as const, {
                                        valueAsNumber: true,
                                      })}
                                      type="number"
                                      placeholder="Qty"
                                      className="block w-full rounded-md border-0 bg-white/5 px-3 py-1.5 text-white ring-1 ring-inset ring-white/10 placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm"
                                    />
                                  </div>
                                  <div className="col-span-3">
                                    <input
                                      {...register(`parts.${index}.cost` as const, {
                                        valueAsNumber: true,
                                      })}
                                      type="number"
                                      placeholder="Cost"
                                      className="block w-full rounded-md border-0 bg-white/5 px-3 py-1.5 text-white ring-1 ring-inset ring-white/10 placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm"
                                    />
                                  </div>
                                  <div className="col-span-1 flex items-center justify-center">
                                    <button
                                      type="button"
                                      onClick={() => remove(index)}
                                      className="text-red-400 hover:text-red-300"
                                    >
                                      <TrashIcon className="size-5" aria-hidden="true" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Labor Cost */}
                          <div>
                            <label
                              htmlFor="laborCost"
                              className="block text-sm font-medium text-white"
                            >
                              Labor Cost ($)
                            </label>
                            <input
                              {...register('laborCost', { valueAsNumber: true })}
                              type="number"
                              className="mt-2 block w-full rounded-md border-0 bg-white/5 px-3 py-1.5 text-white ring-1 ring-inset ring-white/10 placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm"
                              placeholder="0.00"
                            />
                          </div>

                          {/* Total Cost (Calculated) */}
                          <div>
                            <label className="block text-sm font-medium text-white">
                              Total Cost (Calculated)
                            </label>
                            <div className="mt-2 block w-full rounded-md border-0 bg-white/5 px-3 py-1.5 text-white ring-1 ring-inset ring-white/10 sm:text-sm">
                              ${totalCost.toFixed(2)}
                            </div>
                          </div>
                        </div>

                        <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                          <button
                            type="submit"
                            disabled={isSubmitting}
                            className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed sm:ml-3 sm:w-auto"
                          >
                            {isSubmitting ? 'Creating...' : 'Create Maintenance'}
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

  // Fetch vehicles for dropdown
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

  // Fetch maintenance records
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
