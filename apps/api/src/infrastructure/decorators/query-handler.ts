import "reflect-metadata";

const QUERY_HANDLER_METADATA = Symbol("QueryHandler");

export function QueryHandler(query: any) {
  return function (target: any) {
    Reflect.defineMetadata(QUERY_HANDLER_METADATA, query, target);
  };
}

export function getQueryFromHandler(handler: any): any | undefined {
  return Reflect.getMetadata(QUERY_HANDLER_METADATA, handler.constructor);
}


