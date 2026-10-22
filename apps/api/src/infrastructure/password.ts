import { pbkdf2Sync, randomBytes, timingSafeEqual } from 'node:crypto';

const iterations = 120_000;

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const digest = pbkdf2Sync(password, salt, iterations, 32, 'sha256').toString('hex');
  return `${salt}:${digest}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, expectedHex] = stored.split(':');
  if (!salt || !expectedHex) return false;
  const actual = pbkdf2Sync(password, salt, iterations, 32, 'sha256');
  const expected = Buffer.from(expectedHex, 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
