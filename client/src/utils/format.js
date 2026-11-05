export function formatRole(role) {
  if (role === 'admin') return 'Administrator';
  if (role === 'employee') return 'Employee';
  return 'Unknown';
}

export function displayValue(value) {
  const text = typeof value === 'string' ? value.trim() : '';
  return text || 'Not provided';
}
