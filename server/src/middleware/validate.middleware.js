import { error } from '../utils/apiResponse.js';

/**
 * Middleware to validate request data using a Joi schema.
 * @param {import('joi').Schema} schema - Joi schema object
 * @param {string} source - Source of data (body, query, params)
 */
export const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const { error: validationError } = schema.validate(req[source], {
      abortEarly: false,
      allowUnknown: true,
      stripUnknown: true,
    });

    if (validationError) {
      const errorMessage = validationError.details
        .map((detail) => detail.message.replace(/"/g, ''))
        .join(', ');
      return error(res, errorMessage, 400);
    }

    next();
  };
};
