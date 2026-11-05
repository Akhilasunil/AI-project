export function getMissingRuntimeEnv(environment = process.env) {
  const missing = [];
  if (!environment.MONGODB_URI) missing.push('MONGODB_URI');
  if (!environment.JWT_SECRET || environment.JWT_SECRET.length < 16) missing.push('JWT_SECRET');
  return missing;
}

export function assertRuntimeEnv(environment = process.env) {
  const missing = getMissingRuntimeEnv(environment);
  if (missing.length > 0) {
    throw new Error(`Missing or invalid environment variables: ${missing.join(', ')}`);
  }
}
