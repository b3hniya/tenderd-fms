import { Fragment } from 'react';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/20/solid';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  CreateVehicleRequestSchema,
  VehicleType,
  FuelType,
  VehicleStatus,
} from '@tenderd-fms/core-types';
import type { CreateVehicleRequest } from '@tenderd-fms/core-types';

export function AddVehicleModal({
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
