import { ApiError } from './ApiError.js';

function isPrivateAddress(hostname) {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (host === 'localhost' || host.endsWith('.local') || host === '0.0.0.0' || host === '::1') return true;
  const match = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!match) return false;
  const parts = match.slice(1).map(Number);
  if (parts.some((part) => part > 255)) return true;
  const [a, b] = parts;
  return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
}

export function assertPublicHttpsUrl(value, label) {
  let url;
  try {
    url = new URL(String(value || '').trim());
  } catch {
    throw new ApiError(400, `${label} must be a valid HTTPS URL.`);
  }

  if (url.protocol !== 'https:' || url.username || url.password) {
    throw new ApiError(400, `${label} must be a valid HTTPS URL.`);
  }

  if (isPrivateAddress(url.hostname)) {
    throw new ApiError(400, `${label} must point to a public HTTPS address.`);
  }

  return url.toString();
}
