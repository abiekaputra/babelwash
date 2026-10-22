import { DomainError } from './errors.js';
import { Money } from './money.js';
import { calculateLineTotal, type ServiceDefinition } from './service.js';

export const orderStatuses = [
  'RECEIVED',
  'WASHING',
  'DRYING',
  'READY',
  'COLLECTED',
  'CANCELLED',
] as const;

export type OrderStatus = (typeof orderStatuses)[number];
export type PaymentMethod = 'CASH' | 'QRIS';

const transitions: Record<OrderStatus, readonly OrderStatus[]> = {
  RECEIVED: ['WASHING', 'CANCELLED'],
  WASHING: ['DRYING'],
  DRYING: ['READY'],
  READY: ['COLLECTED'],
  COLLECTED: [],
  CANCELLED: [],
};

export interface NewOrderInput {
  customerName: string;
  customerPhone: string;
  service: ServiceDefinition;
  quantity: number;
  notes?: string;
  receivedAt: Date;
}

export class LaundryOrder {
  readonly total: Money;
  readonly dueAt: Date;

  constructor(
    readonly id: string,
    readonly trackingCode: string,
    readonly input: NewOrderInput,
    private currentStatus: OrderStatus = 'RECEIVED',
    private paid: Money = Money.rupiah(0),
  ) {
    this.assertCustomer();
    this.total = calculateLineTotal(input.service, input.quantity);
    this.dueAt = new Date(input.receivedAt.getTime() + input.service.turnaroundHours * 3_600_000);
  }

  get status(): OrderStatus {
    return this.currentStatus;
  }

  get paidAmount(): number {
    return this.paid.amount;
  }

  get balanceAmount(): number {
    return this.total.subtract(this.paid).amount;
  }

  transition(next: OrderStatus): void {
    if (!transitions[this.currentStatus].includes(next)) {
      throw new DomainError(`Cannot move an order from ${this.currentStatus} to ${next}.`);
    }
    if (next === 'COLLECTED' && this.balanceAmount > 0) {
      throw new DomainError('An order must be fully paid before collection.');
    }
    this.currentStatus = next;
  }

  recordPayment(amount: number): void {
    const payment = Money.rupiah(amount);
    if (payment.amount === 0) {
      throw new DomainError('Payment must be greater than zero.');
    }
    this.paid = this.paid.add(payment);
    if (this.paid.amount > this.total.amount) {
      this.paid = this.paid.subtract(payment);
      throw new DomainError('Payment cannot exceed the outstanding balance.');
    }
  }

  private assertCustomer(): void {
    if (this.input.customerName.trim().length < 2) {
      throw new DomainError('Customer name must contain at least two characters.');
    }
    if (!/^\+?[0-9]{9,15}$/.test(this.input.customerPhone)) {
      throw new DomainError('Customer phone must contain 9 to 15 digits.');
    }
  }
}
