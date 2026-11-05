import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ROLES } from '../utils/roles.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function presentUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    team: user.team || '',
    isActive: user.isActive,
    createdAt: user.createdAt,
  };
}

function readRole(value) {
  if (value === ROLES.ADMIN || value === ROLES.EMPLOYEE) return value;
  return '';
}

export const deleteUser = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw new ApiError(404, 'Account not found.');
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'Account not found.');
  if (String(user._id) === String(req.user._id)) throw new ApiError(400, 'You cannot delete your own account.');

  if (user.role === ROLES.ADMIN && user.isActive) {
    const otherAdmins = await User.countDocuments({
      _id: { $ne: user._id },
      role: ROLES.ADMIN,
      isActive: true,
    });
    if (otherAdmins === 0) throw new ApiError(400, 'Keep at least one active administrator.');
  }

  await user.deleteOne();
  res.json({ success: true });
});

export const listUsers = asyncHandler(async (req, res) => {
  const users = await User.find().sort({ name: 1, email: 1 });
  res.json({ success: true, users: users.map((user) => presentUser(user)) });
});

export const createUser = asyncHandler(async (req, res) => {
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  const role = readRole(req.body.role);
  const team = String(req.body.team || '').trim().slice(0, 80);

  if (!name || name.length > 80) throw new ApiError(400, 'Enter a name.');
  if (!EMAIL_PATTERN.test(email) || email.length > 254) throw new ApiError(400, 'Enter a valid work email.');
  if (password.length < 8 || password.length > 128) throw new ApiError(400, 'Password must be at least 8 characters.');
  if (!role) throw new ApiError(400, 'Choose admin or employee access.');

  const existing = await User.findOne({ email });
  if (existing) throw new ApiError(409, 'An account with this email already exists.');

  let user;
  try {
    user = await User.create({ name, email, password, role, team, isActive: true });
  } catch (error) {
    if (error?.code === 11000) throw new ApiError(409, 'An account with this email already exists.');
    throw error;
  }

  res.status(201).json({ success: true, user: presentUser(user) });
});

export const updateUser = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw new ApiError(404, 'Account not found.');
  const user = await User.findById(req.params.id).select('+tokenVersion');
  if (!user) throw new ApiError(404, 'Account not found.');

  const role = req.body.role == null ? user.role : readRole(req.body.role);
  const team = req.body.team == null ? user.team : String(req.body.team).trim().slice(0, 80);
  const isActive = req.body.isActive == null ? user.isActive : req.body.isActive;
  if (!role) throw new ApiError(400, 'Choose admin or employee access.');
  if (typeof isActive !== 'boolean') throw new ApiError(400, 'Choose whether this account is active.');
  if (req.body.name != null) {
    const name = String(req.body.name).trim();
    if (!name || name.length > 80) throw new ApiError(400, 'Enter a name.');
    user.name = name;
  }

  const changingOwnAccess = String(user._id) === String(req.user._id) && (role !== ROLES.ADMIN || !isActive);
  if (changingOwnAccess) throw new ApiError(400, 'You cannot remove your own admin access.');

  const removingAdmin = user.role === ROLES.ADMIN && user.isActive && (role !== ROLES.ADMIN || !isActive);
  if (removingAdmin) {
    const otherAdmins = await User.countDocuments({
      _id: { $ne: user._id },
      role: ROLES.ADMIN,
      isActive: true,
    });
    if (otherAdmins === 0) throw new ApiError(400, 'Keep at least one active administrator.');
  }

  const accessChanged = user.role !== role || user.isActive !== isActive;
  user.role = role;
  user.team = team;
  user.isActive = isActive;
  if (accessChanged) user.tokenVersion = (user.tokenVersion || 0) + 1;
  await user.save({ validateModifiedOnly: true });

  res.json({ success: true, user: presentUser(user) });
});
