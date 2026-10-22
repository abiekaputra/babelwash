import { InventoryItem } from '@babelwash/domain';
import type { DatabaseSync } from 'node:sqlite';

export interface InventoryRecord {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  reorderLevel: number;
  isLow: boolean;
  updatedAt: string;
}

interface InventoryRow {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  reorder_level: number;
  updated_at: string;
}

export class InventoryRepository {
  constructor(private readonly database: DatabaseSync) {}

  list(): InventoryRecord[] {
    return (
      this.database
        .prepare('SELECT * FROM inventory ORDER BY name')
        .all() as unknown as InventoryRow[]
    ).map(mapInventory);
  }

  adjust(id: string, delta: number, reason: string, actorId: string): InventoryRecord | null {
    const row = this.database.prepare('SELECT * FROM inventory WHERE id = ?').get(id) as
      InventoryRow | undefined;
    if (!row) return null;
    const item = new InventoryItem(row.id, row.name, row.unit, row.quantity, row.reorder_level);
    item.adjust(delta);
    const at = new Date().toISOString();
    this.database.exec('BEGIN IMMEDIATE');
    try {
      this.database
        .prepare('UPDATE inventory SET quantity = ?, updated_at = ? WHERE id = ?')
        .run(item.quantity, at, id);
      this.database
        .prepare('INSERT INTO inventory_movements VALUES (?, ?, ?, ?, ?, ?)')
        .run(crypto.randomUUID(), id, delta, reason, actorId, at);
      this.database.exec('COMMIT');
    } catch (error) {
      this.database.exec('ROLLBACK');
      throw error;
    }
    return { ...mapInventory(row), quantity: item.quantity, isLow: item.isLow, updatedAt: at };
  }
}

function mapInventory(row: InventoryRow): InventoryRecord {
  const item = new InventoryItem(row.id, row.name, row.unit, row.quantity, row.reorder_level);
  return {
    id: row.id,
    name: row.name,
    unit: row.unit,
    quantity: item.quantity,
    reorderLevel: row.reorder_level,
    isLow: item.isLow,
    updatedAt: row.updated_at,
  };
}
