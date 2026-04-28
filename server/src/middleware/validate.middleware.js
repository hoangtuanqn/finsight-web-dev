import { z } from 'zod';
import { error } from '../utils/apiResponse.js';

/**
 * Middleware to validate request data using a Zod schema.
 * @param {import('zod').ZodSchema} schema - Zod schema object
 * @param {string} source - Source of data (body, query, params)
 */
export const validate = (schema, source = 'body') => {
  return async (req, res, next) => {
    try {
      const validatedData = await schema.parseAsync(req[source]);
      req[source] = validatedData; // Use validated/transformed data
      next();
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        const issues = validationError.errors || validationError.issues || [];
        const errorMessage = issues.map((err) => err.message).join(', ');
        return error(res, errorMessage, 400);
      }
      next(validationError);
    }
  };
};
