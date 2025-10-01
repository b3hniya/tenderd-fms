import Joi from "joi";

const validateEnv = () => {
  const envVarsSchema = Joi.object({
    PORT: Joi.number().default(3000),
  }).unknown();

  const { value, error } = envVarsSchema.validate(process.env);

  if (error) {
    throw new Error(`Config validation error: ${error.message}`);
  }

  return value;
};

export default validateEnv;
