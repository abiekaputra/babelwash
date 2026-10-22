import { DomainError } from './errors.js';
import { Money } from './money.js';

export type ServiceUnit = 'KILOGRAM' | 'ITEM';

export interface ServiceDefinition {
  id: string;
  name: string;
  unit: ServiceUnit;
  unitPrice: number;
  minimumQuantity: number;
  turnaroundHours: number;
}

export function calculateLineTotal(service: ServiceDefinition, quantity: number): Money {
  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new DomainError('Quantity must be greater than zero.');
  }
  const billableQuantity = Math.max(quantity, service.minimumQuantity);
  return Money.rupiah(Math.round(billableQuantity * service.unitPrice));
}
