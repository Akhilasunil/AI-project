import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { hashPassword, verifyPassword } from '../utils/password.js';

const INVALID_LOGIN = 'Email or password is incorrect.';
const INACTIVE_ACCOUNT = 'This account is not active. Contact an administrator.';

let dummyHashPromise;

function getDummyHash() {
  if (!dummyHashPromise) {
    dummyHashPromise = hashPassword('not-a-real-password');
  }
  return dummyHashPromise;
}

function signToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role, tv: user.tokenVersion },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' },
  );
}

export const login = asyncHandler(async (req, res) => {
  const email = String(req.body.email || '');
  const password = String(req.body.password || '');
  const user = await User.findByEmail(email);

  if (!user) {
    await verifyPassword(password, await getDummyHash());
    throw new ApiError(401, INVALID_LOGIN);
  }

  const matches = await verifyPassword(password, user.password);
  if (!matches) {
    throw new ApiError(401, INVALID_LOGIN);
  }

  if (!user.isActive) {
    throw new ApiError(403, INACTIVE_ACCOUNT);
  }

  res.json({
    success: true,
    token: signToken(user),
    user: user.toJSON(),
  });
});

export const me = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    user: req.user.toJSON(),
  });
});

export const logout = asyncHandler(async (req, res) => {
  req.user.tokenVersion = (req.user.tokenVersion || 0) + 1;
  await req.user.save({ validateModifiedOnly: true });
  res.json({ success: true });
});
