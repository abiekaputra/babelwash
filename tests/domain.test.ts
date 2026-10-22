import { describe, expect, it } from 'vitest';
import { DomainError, InventoryItem, LaundryOrder } from '../packages/domain/src/index.js';

const service = {
  id: 'wash-fold',
  name: 'Wash & Fold',
  unit: 'KILOGRAM' as const,
  unitPrice: 8_000,
  minimumQuantity: 3,
  turnaroundHours: 48,
};

function order() {
  return new LaundryOrder('order-1', 'BW-TEST', {
    customerName: 'Ari Customer',
    customerPhone: '081234567890',
    service,
    quantity: 1.5,
    receivedAt: new Date('2026-10-22T08:00:00.000Z'),
  });
}

describe('LaundryOrder', () => {
  it('applies the service minimum and due-time policy', () => {
    const subject = order();
    expect(subject.total.amount).toBe(24_000);
    expect(subject.dueAt.toISOString()).toBe('2026-10-24T08:00:00.000Z');
  });

  it('rejects invalid state jumps', () => {
    expect(() => order().transition('READY')).toThrow(DomainError);
  });

  it('requires full payment before collection', () => {
    const subject = order();
    subject.transition('WASHING');
    subject.transition('DRYING');
    subject.transition('READY');
    expect(() => subject.transition('COLLECTED')).toThrow('fully paid');
    subject.recordPayment(24_000);
    subject.transition('COLLECTED');
    expect(subject.status).toBe('COLLECTED');
  });

  it('rejects overpayment', () => {
    expect(() => order().recordPayment(24_001)).toThrow('cannot exceed');
  });
});

describe('InventoryItem', () => {
  it('detects reorder risk and prevents negative stock', () => {
    const item = new InventoryItem('soap', 'Detergent', 'litre', 6, 5);
    item.adjust(-1);
    expect(item.isLow).toBe(true);
    expect(() => item.adjust(-6)).toThrow('below zero');
  });
});
