import {
  DomainError,
  LaundryOrder,
  Money,
  type OrderStatus,
  type PaymentMethod,
} from '@babelwash/domain';
import { OrderRepository } from '../repositories/order-repository.js';
import type { OrderRecord, PaymentRecord } from '../types.js';

export interface CreateOrderCommand {
  customerName: string;
  customerPhone: string;
  serviceId: string;
  quantity: number;
  notes?: string;
}

export class OrderService {
  constructor(private readonly orders: OrderRepository) {}

  create(command: CreateOrderCommand, actorId: string): OrderRecord {
    const service = this.orders.service(command.serviceId);
    if (!service) throw new DomainError('Selected service is not available.');
    const now = new Date();
    const id = crypto.randomUUID();
    const domain = new LaundryOrder(id, createTrackingCode(now), {
      customerName: command.customerName,
      customerPhone: command.customerPhone,
      service,
      quantity: command.quantity,
      ...(command.notes ? { notes: command.notes } : {}),
      receivedAt: now,
    });
    const order: OrderRecord = {
      id,
      trackingCode: domain.trackingCode,
      customerName: command.customerName.trim(),
      customerPhone: command.customerPhone,
      service,
      quantity: command.quantity,
      notes: command.notes?.trim() || null,
      status: domain.status,
      totalAmount: domain.total.amount,
      paidAmount: 0,
      receivedAt: now.toISOString(),
      dueAt: domain.dueAt.toISOString(),
      updatedAt: now.toISOString(),
    };
    this.orders.insert(order, actorId);
    return order;
  }

  transition(id: string, next: OrderStatus, actorId: string): OrderRecord {
    const existing = this.requireOrder(id);
    const domain = hydrate(existing);
    domain.transition(next);
    const at = new Date().toISOString();
    this.orders.updateStatus(id, existing.status, next, actorId, at);
    return { ...existing, status: next, updatedAt: at };
  }

  payment(id: string, amount: number, method: PaymentMethod): PaymentRecord {
    const existing = this.requireOrder(id);
    const domain = hydrate(existing);
    domain.recordPayment(amount);
    const payment: PaymentRecord = {
      id: crypto.randomUUID(),
      orderId: id,
      amount,
      method,
      createdAt: new Date().toISOString(),
    };
    this.orders.insertPayment(payment);
    return payment;
  }

  private requireOrder(id: string): OrderRecord {
    const order = this.orders.findById(id);
    if (!order) throw new DomainError('Order was not found.');
    return order;
  }
}

function hydrate(record: OrderRecord): LaundryOrder {
  return new LaundryOrder(
    record.id,
    record.trackingCode,
    {
      customerName: record.customerName,
      customerPhone: record.customerPhone,
      service: record.service,
      quantity: record.quantity,
      ...(record.notes ? { notes: record.notes } : {}),
      receivedAt: new Date(record.receivedAt),
    },
    record.status,
    Money.rupiah(record.paidAmount),
  );
}

function createTrackingCode(now: Date): string {
  const date = now.toISOString().slice(2, 10).replaceAll('-', '');
  const suffix = crypto.randomUUID().slice(0, 4).toUpperCase();
  return `BW-${date}-${suffix}`;
}
