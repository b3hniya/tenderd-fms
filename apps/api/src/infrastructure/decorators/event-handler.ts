import "reflect-metadata";

const EVENT_HANDLER_METADATA = Symbol("EventHandler");

export function EventHandler(event: any) {
  return function (target: any) {
    Reflect.defineMetadata(EVENT_HANDLER_METADATA, event, target);
  };
}

export function getEventFromHandler(handler: any): any | undefined {
  return Reflect.getMetadata(EVENT_HANDLER_METADATA, handler.constructor);
}


