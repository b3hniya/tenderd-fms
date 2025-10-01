export class VehicleCreatedEvent {
  constructor(
    public readonly vehicleId: string,
    public readonly vehicleData: {
      model: string;
      type: string;
      status: "active" | "maintenance" | "inactive";
    }
  ) {}
}


