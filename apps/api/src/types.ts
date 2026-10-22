import type { OrderStatus, PaymentMethod, ServiceDefinition } from '@babelwash/domain';

export type UserRole = 'OWNER' | 'STAFF';

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface OrderRecord {
  id: string;
  trackingCode: string;
  customerName: string;
  customerPhone: string;
  service: ServiceDefinition;
  quantity: number;
  notes: string | null;
  status: OrderStatus;
  totalAmount: number;
  paidAmount: number;
  receivedAt: string;
  dueAt: string;
  updatedAt: string;
}

export interface PaymentRecord {
  id: string;
  orderId: string;
  amount: number;
  method: PaymentMethod;
  createdAt: string;
}
