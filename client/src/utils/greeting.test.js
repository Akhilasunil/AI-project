import test from 'node:test';
import assert from 'node:assert/strict';
import { greeting } from './greeting.js';

test('greets in the morning', () => {
  assert.equal(greeting(new Date(2026, 9, 27, 8, 0, 0)), 'Good morning');
});

test('greets in the afternoon', () => {
  assert.equal(greeting(new Date(2026, 9, 27, 13, 0, 0)), 'Good afternoon');
});

test('greets in the evening', () => {
  assert.equal(greeting(new Date(2026, 9, 27, 18, 0, 0)), 'Good evening');
});
