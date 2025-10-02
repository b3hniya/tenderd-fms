import "reflect-metadata";

const VALIDATOR_METADATA = Symbol("Validator");

export function Validator(target: any) {
  return function (validatorClass: any) {
    Reflect.defineMetadata(VALIDATOR_METADATA, target, validatorClass);
  };
}

export function getTargetFromValidator(validator: any): any | undefined {
  return Reflect.getMetadata(VALIDATOR_METADATA, validator.constructor);
}
