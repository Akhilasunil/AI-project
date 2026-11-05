import test from 'node:test';
import assert from 'node:assert/strict';
import { getMissingRuntimeEnv } from '../src/config/env.js';

test('reports missing database and secret settings', () => {
  const missing = getMissingRuntimeEnv({});
  assert.deepEqual(missing, ['MONGODB_URI', 'JWT_SECRET']);
});

test('accepts a database URI and a long JWT secret', () => {
  const missing = getMissingRuntimeEnv({
    MONGODB_URI: 'mongodb://127.0.0.1:27017/company-ai',
    JWT_SECRET: '1234567890123456',
  });
  assert.deepEqual(missing, []);
});

test('rejects a short JWT secret', () => {
  const missing = getMissingRuntimeEnv({
    MONGODB_URI: 'mongodb://127.0.0.1:27017/company-ai',
    JWT_SECRET: 'short',
  });
  assert.deepEqual(missing, ['JWT_SECRET']);
});
