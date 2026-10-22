import { mkdirSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { hashPassword } from './password.js';

export function openDatabase(path: string, reset: boolean): DatabaseSync {
  const absolutePath = resolve(path);
  mkdirSync(dirname(absolutePath), { recursive: true });
  if (reset) rmSync(absolutePath, { force: true });
  const database = new DatabaseSync(absolutePath);
  database.exec('PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;');
  migrate(database);
  seed(database);
  return database;
}

function migrate(database: DatabaseSync): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('OWNER', 'STAFF'))
    );
    CREATE TABLE IF NOT EXISTS services (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      unit TEXT NOT NULL CHECK(unit IN ('KILOGRAM', 'ITEM')),
      unit_price INTEGER NOT NULL CHECK(unit_price >= 0),
      minimum_quantity REAL NOT NULL CHECK(minimum_quantity > 0),
      turnaround_hours INTEGER NOT NULL CHECK(turnaround_hours > 0),
      active INTEGER NOT NULL DEFAULT 1
    );
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      tracking_code TEXT NOT NULL UNIQUE,
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      service_id TEXT NOT NULL REFERENCES services(id),
      quantity REAL NOT NULL CHECK(quantity > 0),
      notes TEXT,
      status TEXT NOT NULL,
      total_amount INTEGER NOT NULL CHECK(total_amount >= 0),
      received_at TEXT NOT NULL,
      due_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      amount INTEGER NOT NULL CHECK(amount > 0),
      method TEXT NOT NULL CHECK(method IN ('CASH', 'QRIS')),
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS status_events (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      from_status TEXT,
      to_status TEXT NOT NULL,
      actor_id TEXT NOT NULL REFERENCES users(id),
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS inventory (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      unit TEXT NOT NULL,
      quantity REAL NOT NULL CHECK(quantity >= 0),
      reorder_level REAL NOT NULL CHECK(reorder_level >= 0),
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS inventory_movements (
      id TEXT PRIMARY KEY,
      inventory_id TEXT NOT NULL REFERENCES inventory(id),
      delta REAL NOT NULL CHECK(delta != 0),
      reason TEXT NOT NULL,
      actor_id TEXT NOT NULL REFERENCES users(id),
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_orders_updated ON orders(updated_at DESC);
  `);
}

function seed(database: DatabaseSync): void {
  const userCount = database.prepare('SELECT COUNT(*) count FROM users').get() as { count: number };
  if (userCount.count === 0) {
    const insert = database.prepare(
      'INSERT INTO users (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)',
    );
    insert.run(
      'owner-demo',
      'Alya Owner',
      'owner@babelwash.local',
      hashPassword('washday123'),
      'OWNER',
    );
    insert.run(
      'staff-demo',
      'Bima Staff',
      'staff@babelwash.local',
      hashPassword('washday123'),
      'STAFF',
    );
  }
  const serviceCount = database.prepare('SELECT COUNT(*) count FROM services').get() as {
    count: number;
  };
  if (serviceCount.count === 0) {
    const insert = database.prepare('INSERT INTO services VALUES (?, ?, ?, ?, ?, ?, 1)');
    insert.run('wash-fold', 'Wash & Fold', 'KILOGRAM', 8_000, 3, 48);
    insert.run('wash-iron', 'Wash & Iron', 'KILOGRAM', 11_000, 3, 72);
    insert.run('express', 'Express Wash', 'KILOGRAM', 16_000, 3, 12);
    insert.run('bed-cover', 'Bed Cover', 'ITEM', 25_000, 1, 72);
  }
  const inventoryCount = database.prepare('SELECT COUNT(*) count FROM inventory').get() as {
    count: number;
  };
  if (inventoryCount.count === 0) {
    const now = new Date().toISOString();
    const insert = database.prepare('INSERT INTO inventory VALUES (?, ?, ?, ?, ?, ?)');
    insert.run('detergent', 'Detergent', 'litre', 18, 5, now);
    insert.run('softener', 'Fabric softener', 'litre', 12, 4, now);
    insert.run('packaging', 'Packaging', 'piece', 80, 20, now);
  }
}
