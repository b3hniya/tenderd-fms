'use client';
import { Fragment } from 'react';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { XMarkIcon, PlusIcon, TrashIcon } from '@heroicons/react/20/solid';
import { useForm, useFieldArray } from 'react-hook-form';
import { MaintenanceType, MaintenanceStatus } from '@tenderd-fms/core-types';
import { MaintenanceFormData } from './MaintenanceFormData';

export function CreateMaintenanceModal({
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
