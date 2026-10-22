import { DomainError } from './errors.js';

export class Money {
  private constructor(readonly amount: number) {}

  static rupiah(amount: number): Money {
    if (!Number.isInteger(amount) || amount < 0) {
      throw new DomainError('Money must be a non-negative whole rupiah amount.');
    }
    return new Money(amount);
  }

  add(other: Money): Money {
    return Money.rupiah(this.amount + other.amount);
  }

  subtract(other: Money): Money {
    if (other.amount > this.amount) {
      throw new DomainError('Payment cannot exceed the outstanding balance.');
    }
    return Money.rupiah(this.amount - other.amount);
  }
}
