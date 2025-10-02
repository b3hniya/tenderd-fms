export type * from './requests.types';
export type * from './responses.types';
export {
  CreateVehicleRequestSchema,
  UpdateVehicleRequestSchema,
  GetVehicleByIdRequestSchema,
  GetAllVehiclesRequestSchema,
} from './validators';

export type {
  CreateVehicleRequestValidated,
  UpdateVehicleRequestValidated,
  GetVehicleByIdRequestValidated,
  GetAllVehiclesRequestValidated,
} from './validators';
