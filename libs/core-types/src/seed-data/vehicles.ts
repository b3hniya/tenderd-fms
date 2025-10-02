import { VehicleType, VehicleStatus, FuelType } from '../enums/index';

/**
 * Static test vehicle data for seeding and simulation
 * Single source of truth for all environments
 */
export interface SeedVehicle {
  _id: string; // MongoDB ObjectId format
  vin: string;
  licensePlate: string;
  vehicleModel: string;
  manufacturer: string;
  year: number;
  type: VehicleType;
  fuelType: FuelType;
  status: VehicleStatus;
}

/**
 * Test vehicles for IoT simulator
 * These will be created in the database by the seeder
 */
export const SEED_VEHICLES: SeedVehicle[] = [
  {
    _id: '670000000000000000000001',
    vin: 'SIM1ABC123DEF4567',
    licensePlate: 'DXB-SIM-001',
    vehicleModel: 'Transit Van',
    manufacturer: 'Ford',
    year: 2022,
    type: VehicleType.VAN,
    fuelType: FuelType.DIESEL,
    status: VehicleStatus.ACTIVE,
  },
  {
    _id: '670000000000000000000002',
    vin: 'SIM2XYZ789GHI0123',
    licensePlate: 'DXB-SIM-002',
    vehicleModel: 'Sprinter',
    manufacturer: 'Mercedes-Benz',
    year: 2023,
    type: VehicleType.VAN,
    fuelType: FuelType.DIESEL,
    status: VehicleStatus.ACTIVE,
  },
  {
    _id: '670000000000000000000003',
    vin: 'SIM3LMN456OPQ7890',
    licensePlate: 'DXB-SIM-003',
    vehicleModel: 'F-150',
    manufacturer: 'Ford',
    year: 2021,
    type: VehicleType.TRUCK,
    fuelType: FuelType.GASOLINE,
    status: VehicleStatus.ACTIVE,
  },
  {
    _id: '670000000000000000000004',
    vin: 'SIM4RST123UVW4567',
    licensePlate: 'DXB-SIM-004',
    vehicleModel: 'Hiace',
    manufacturer: 'Toyota',
    year: 2022,
    type: VehicleType.VAN,
    fuelType: FuelType.DIESEL,
    status: VehicleStatus.ACTIVE,
  },
  {
    _id: '670000000000000000000005',
    vin: 'SIM5DEF789GHI0123',
    licensePlate: 'DXB-SIM-005',
    vehicleModel: 'Silverado',
    manufacturer: 'Chevrolet',
    year: 2023,
    type: VehicleType.TRUCK,
    fuelType: FuelType.GASOLINE,
    status: VehicleStatus.ACTIVE,
  },
  {
    _id: '670000000000000000000006',
    vin: 'SIM6JKL456MNO7890',
    licensePlate: 'DXB-SIM-006',
    vehicleModel: 'Transit Connect',
    manufacturer: 'Ford',
    year: 2022,
    type: VehicleType.VAN,
    fuelType: FuelType.DIESEL,
    status: VehicleStatus.ACTIVE,
  },
  {
    _id: '670000000000000000000007',
    vin: 'SIM7PQR123STU4567',
    licensePlate: 'DXB-SIM-007',
    vehicleModel: 'ProMaster',
    manufacturer: 'Ram',
    year: 2021,
    type: VehicleType.VAN,
    fuelType: FuelType.DIESEL,
    status: VehicleStatus.ACTIVE,
  },
  {
    _id: '670000000000000000000008',
    vin: 'SIM8VWX789YZA0123',
    licensePlate: 'DXB-SIM-008',
    vehicleModel: 'Ranger',
    manufacturer: 'Ford',
    year: 2023,
    type: VehicleType.TRUCK,
    fuelType: FuelType.DIESEL,
    status: VehicleStatus.ACTIVE,
  },
  {
    _id: '670000000000000000000009',
    vin: 'SIM9BCD456EFG7890',
    licensePlate: 'DXB-SIM-009',
    vehicleModel: 'Express Cargo',
    manufacturer: 'Chevrolet',
    year: 2022,
    type: VehicleType.VAN,
    fuelType: FuelType.GASOLINE,
    status: VehicleStatus.ACTIVE,
  },
  {
    _id: '670000000000000000000010',
    vin: 'SIM10HIJ123KLM456',
    licensePlate: 'DXB-SIM-010',
    vehicleModel: 'Tundra',
    manufacturer: 'Toyota',
    year: 2023,
    type: VehicleType.TRUCK,
    fuelType: FuelType.GASOLINE,
    status: VehicleStatus.ACTIVE,
  },
];

/**
 * Get vehicle IDs for IoT simulator
 */
export function getVehicleIds(): string[] {
  return SEED_VEHICLES.map(v => v._id);
}

/**
 * Get a specific vehicle by index
 */
export function getVehicleById(id: string): SeedVehicle | undefined {
  return SEED_VEHICLES.find(v => v._id === id);
}

/**
 * Get N vehicles for simulation
 */
export function getVehiclesForSimulation(count: number): SeedVehicle[] {
  return SEED_VEHICLES.slice(0, Math.min(count, SEED_VEHICLES.length));
}
