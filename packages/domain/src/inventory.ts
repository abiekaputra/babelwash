import { DomainError } from './errors.js';

export class InventoryItem {
  constructor(
    readonly id: string,
    readonly name: string,
    readonly unit: string,
    private currentQuantity: number,
    readonly reorderLevel: number,
  ) {
    if (currentQuantity < 0 || reorderLevel < 0) {
      throw new DomainError('Inventory quantities cannot be negative.');
    }
  }

  get quantity(): number {
    return this.currentQuantity;
  }

  get isLow(): boolean {
    return this.currentQuantity <= this.reorderLevel;
  }

  adjust(delta: number): void {
    if (!Number.isFinite(delta) || delta === 0) {
      throw new DomainError('Inventory adjustment must be a non-zero number.');
    }
    if (this.currentQuantity + delta < 0) {
      throw new DomainError('Inventory cannot fall below zero.');
    }
    this.currentQuantity += delta;
  }
}
