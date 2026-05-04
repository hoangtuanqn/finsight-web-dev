import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { error } from '../utils/apiResponse';

/**
 * Middleware to validate request data using a Zod schema.
 * @param {z.ZodSchema} schema - Zod schema object
 * @param {string} source - Source of data (body, query, params)
 */
export const validate = (schema: z.ZodSchema, source: 'body' | 'query' | 'params' = 'body') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = await schema.parseAsync(req[source]);
      req[source] = validatedData; // Use validated/transformed data
      next();
    } catch (validationError: any) {
      if (validationError instanceof z.ZodError) {
        const errorMessage = validationError.issues.map((err: any) => err.message).join(', ');
        return error(res, errorMessage, 400);
      }
      next(validationError);
    }
  };
};
