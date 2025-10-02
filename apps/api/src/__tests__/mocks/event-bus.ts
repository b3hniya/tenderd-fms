export interface IEventHandler<T = any> {
  handle(event: T): Promise<void>;
}

export class EventBus {
  publish = jest.fn().mockResolvedValue(undefined);
  registerHandlers = jest.fn();
  subscribe = jest.fn();
}
