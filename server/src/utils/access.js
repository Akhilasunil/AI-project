export function canAccess(user, record) {
  if (!user || !record) return false;
  if (user.role === 'admin') return true;

  const access = record.access || { scope: 'all' };
  if (access.scope === 'all') return true;

  const teams = access.teams || [];
  if (access.scope === 'team') return Boolean(user.team) && teams.includes(user.team);

  const userIds = (access.userIds || []).map((id) => id.toString());
  if (userIds.includes(user.id.toString())) return true;
  return Boolean(user.team) && teams.includes(user.team);
}
