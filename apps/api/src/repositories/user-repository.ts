import type { DatabaseSync } from 'node:sqlite';
import { verifyPassword } from '../infrastructure/password.js';
import type { SessionUser } from '../types.js';

interface UserRow extends SessionUser {
  password_hash: string;
}

export class UserRepository {
  constructor(private readonly database: DatabaseSync) {}

  authenticate(email: string, password: string): SessionUser | null {
    const row = this.database
      .prepare(
        'SELECT id, name, email, role, password_hash FROM users WHERE lower(email) = lower(?)',
      )
      .get(email) as UserRow | undefined;
    if (!row || !verifyPassword(password, row.password_hash)) return null;
    return { id: row.id, name: row.name, email: row.email, role: row.role };
  }
}
