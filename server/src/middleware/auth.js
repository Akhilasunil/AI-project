import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const EXPIRED = 'Your session has expired. Sign in again.';

export const requireAuth = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';

  if (!token) {
    throw new ApiError(401, 'Authentication required.');
  }

  if (!process.env.JWT_SECRET) {
    throw new ApiError(500, 'Server authentication is not configured.');
  }

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new ApiError(401, EXPIRED);
  }

  if (!payload?.sub || typeof payload.tv !== 'number') {
    throw new ApiError(401, EXPIRED);
  }

  const user = await User.findById(payload.sub).select('+tokenVersion');
  if (!user || user.tokenVersion !== payload.tv) {
    throw new ApiError(401, EXPIRED);
  }

  if (!user.isActive) {
    throw new ApiError(403, 'This account is not active. Contact an administrator.');
  }

  req.user = user;
  next();
});

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      next(new ApiError(403, 'You do not have access to this resource.'));
      return;
    }
    next();
  };
}
