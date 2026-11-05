import { ApiError } from '../utils/ApiError.js';

export function notFound(req, res) {
  res.status(404).json({ success: false, message: 'Not found' });
}

export function errorHandler(err, req, res, _next) {
  if (err?.type === 'entity.parse.failed') {
    res.status(400).json({ success: false, message: 'Request body must be valid JSON.' });
    return;
  }

  if (err?.type === 'entity.too.large' || err?.code === 'LIMIT_FILE_SIZE') {
    res.status(400).json({ success: false, message: 'File is too large.' });
    return;
  }

  if (err?.code === 'LIMIT_FILE_COUNT' || err?.code === 'LIMIT_UNEXPECTED_FILE') {
    res.status(400).json({ success: false, message: 'Too many files were selected.' });
    return;
  }

  const statusCode = err instanceof ApiError ? err.statusCode : err.statusCode || 500;
  const message = statusCode >= 500 ? 'Something went wrong. Try again.' : err.message;

  if (statusCode >= 500 && process.env.NODE_ENV !== 'test') {
    console.error(err);
  }

  const body = { success: false, message };
  if (err instanceof ApiError && Array.isArray(err.errors) && err.errors.length > 0) {
    body.errors = err.errors;
  }

  res.status(statusCode).json(body);
}
