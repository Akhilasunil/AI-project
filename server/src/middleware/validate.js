import { validationResult } from 'express-validator';
import { ApiError } from '../utils/ApiError.js';

export function validate(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) {
    next();
    return;
  }

  const errors = result.array().map((issue) => ({
    field: issue.path,
    message: issue.msg,
  }));

  next(new ApiError(400, errors[0].message, errors));
}
