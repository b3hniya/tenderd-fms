import "reflect-metadata";

const COMMAND_HANDLER_METADATA = Symbol("CommandHandler");

export function CommandHandler(command: any) {
  return function (target: any) {
    Reflect.defineMetadata(COMMAND_HANDLER_METADATA, command, target);
  };
}

export function getCommandFromHandler(handler: any): any | undefined {
  return Reflect.getMetadata(COMMAND_HANDLER_METADATA, handler.constructor);
}


