import type { ServiceDefinition } from '@babelwash/domain';
import type { DatabaseSync } from 'node:sqlite';
import type { OrderRecord, PaymentRecord } from '../types.js';

type OrderRow = Record<string, string | number | null>;

export class OrderRepository {
  constructor(private readonly database: DatabaseSync) {}

  list(): OrderRecord[] {
    const rows = this.database
      .prepare(`${orderSelect} ORDER BY o.updated_at DESC`)
      .all() as OrderRow[];
    return rows.map(mapOrder);
  }

  findById(id: string): OrderRecord | null {
    const row = this.database.prepare(`${orderSelect} WHERE o.id = ?`).get(id) as
      OrderRow | undefined;
    return row ? mapOrder(row) : null;
  }

  findByTrackingCode(code: string): OrderRecord | null {
    const row = this.database.prepare(`${orderSelect} WHERE o.tracking_code = ?`).get(code) as
      OrderRow | undefined;
    return row ? mapOrder(row) : null;
  }

  services(): ServiceDefinition[] {
    const rows = this.database
      .prepare('SELECT * FROM services WHERE active = 1 ORDER BY unit_price')
      .all() as OrderRow[];
    return rows.map(mapService);
  }

  service(id: string): ServiceDefinition | null {
    const row = this.database
      .prepare('SELECT * FROM services WHERE id = ? AND active = 1')
      .get(id) as OrderRow | undefined;
    return row ? mapService(row) : null;
  }

  insert(order: OrderRecord, actorId: string): void {
    this.database.exec('BEGIN IMMEDIATE');
    try {
      this.database
        .prepare(
          `INSERT INTO orders
          (id, tracking_code, customer_name, customer_phone, service_id, quantity, notes,
           status, total_amount, received_at, due_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          order.id,
          order.trackingCode,
          order.customerName,
          order.customerPhone,
          order.service.id,
          order.quantity,
          order.notes,
          order.status,
          order.totalAmount,
          order.receivedAt,
          order.dueAt,
          order.updatedAt,
        );
      this.insertStatusEvent(order.id, null, 'RECEIVED', actorId, order.receivedAt);
      this.database.exec('COMMIT');
    } catch (error) {
      this.database.exec('ROLLBACK');
      throw error;
    }
  }

  updateStatus(id: string, from: string, to: string, actorId: string, at: string): void {
    this.database.exec('BEGIN IMMEDIATE');
    try {
      this.database
        .prepare('UPDATE orders SET status = ?, updated_at = ? WHERE id = ?')
        .run(to, at, id);
      this.insertStatusEvent(id, from, to, actorId, at);
      this.database.exec('COMMIT');
    } catch (error) {
      this.database.exec('ROLLBACK');
      throw error;
    }
  }

  payments(orderId: string): PaymentRecord[] {
    return this.database
      .prepare(
        'SELECT id, order_id orderId, amount, method, created_at createdAt FROM payments WHERE order_id = ? ORDER BY created_at',
      )
      .all(orderId) as unknown as PaymentRecord[];
  }

  timeline(orderId: string): Array<{ status: string; createdAt: string }> {
    return this.database
      .prepare(
        'SELECT to_status status, created_at createdAt FROM status_events WHERE order_id = ? ORDER BY created_at',
      )
      .all(orderId) as Array<{ status: string; createdAt: string }>;
  }

  insertPayment(payment: PaymentRecord): void {
    this.database
      .prepare(
        'INSERT INTO payments (id, order_id, amount, method, created_at) VALUES (?, ?, ?, ?, ?)',
      )
      .run(payment.id, payment.orderId, payment.amount, payment.method, payment.createdAt);
  }

  private insertStatusEvent(
    orderId: string,
    from: string | null,
    to: string,
    actorId: string,
    at: string,
  ): void {
    this.database
      .prepare('INSERT INTO status_events VALUES (?, ?, ?, ?, ?, ?)')
      .run(crypto.randomUUID(), orderId, from, to, actorId, at);
  }
}

const orderSelect = `SELECT o.*, s.name service_name, s.unit service_unit,
  s.unit_price, s.minimum_quantity, s.turnaround_hours,
  COALESCE((SELECT SUM(amount) FROM payments p WHERE p.order_id = o.id), 0) paid_amount
  FROM orders o JOIN services s ON s.id = o.service_id`;

function mapOrder(row: OrderRow): OrderRecord {
  return {
    id: String(row.id),
    trackingCode: String(row.tracking_code),
    customerName: String(row.customer_name),
    customerPhone: String(row.customer_phone),
    service: {
      id: String(row.service_id),
      name: String(row.service_name),
      unit: String(row.service_unit) as ServiceDefinition['unit'],
      unitPrice: Number(row.unit_price),
      minimumQuantity: Number(row.minimum_quantity),
      turnaroundHours: Number(row.turnaround_hours),
    },
    quantity: Number(row.quantity),
    notes: row.notes === null ? null : String(row.notes),
    status: String(row.status) as OrderRecord['status'],
    totalAmount: Number(row.total_amount),
    paidAmount: Number(row.paid_amount),
    receivedAt: String(row.received_at),
    dueAt: String(row.due_at),
    updatedAt: String(row.updated_at),
  };
}

function mapService(row: OrderRow): ServiceDefinition {
  return {
    id: String(row.id),
    name: String(row.name),
    unit: String(row.unit) as ServiceDefinition['unit'],
    unitPrice: Number(row.unit_price),
    minimumQuantity: Number(row.minimum_quantity),
    turnaroundHours: Number(row.turnaround_hours),
  };
}
