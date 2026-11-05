import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';

export async function resolveAccess(body) {
  const scope = body.accessScope || 'all';
  if (!['all', 'team', 'restricted'].includes(scope)) {
    throw new ApiError(400, 'Choose who can access this.');
  }

  if (scope === 'all') return { scope, teams: [], emails: [], userIds: [] };

  if (scope === 'team') {
    const team = String(body.team || '').trim();
    if (!team) throw new ApiError(400, 'Enter the team that can access this.');
    return { scope, teams: [team], emails: [], userIds: [] };
  }

  const emails = String(body.emails || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
  if (!emails.length) throw new ApiError(400, 'Enter at least one employee email for restricted access.');

  const users = await User.find({ email: { $in: emails }, isActive: true });
  const found = new Set(users.map((user) => user.email));
  const missing = emails.filter((email) => !found.has(email));
  if (missing.length) throw new ApiError(400, `No active account for ${missing.join(', ')}.`);

  return { scope, teams: [], emails, userIds: users.map((user) => user._id) };
}
