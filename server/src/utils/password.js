import bcrypt from 'bcryptjs';

const ROUNDS = 12;

export function hashPassword(plainText) {
  return bcrypt.hash(plainText, ROUNDS);
}

export function verifyPassword(plainText, passwordHash) {
  return bcrypt.compare(plainText, passwordHash);
}
