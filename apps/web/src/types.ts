export type Role = 'OWNER' | 'STAFF';
export type OrderStatus = 'RECEIVED' | 'WASHING' | 'DRYING' | 'READY' | 'COLLECTED' | 'CANCELLED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface Service {
  id: string;
  name: string;
  unit: 'KILOGRAM' | 'ITEM';
  unitPrice: number;
  minimumQuantity: number;
  turnaroundHours: number;
}

export interface Order {
  id: string;
  trackingCode: string;
  customerName: string;
  customerPhone: string;
  service: Service;
  quantity: number;
  notes: string | null;
  status: OrderStatus;
  totalAmount: number;
  paidAmount: number;
  receivedAt: string;
  dueAt: string;
  updatedAt: string;
}

export interface Inventory {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  reorderLevel: number;
  isLow: boolean;
  updatedAt: string;
}

export interface Dashboard {
  activeOrders: number;
  readyOrders: number;
  outstandingAmount: number;
  dueSoon: number;
  lowStock: Inventory[];
  recentOrders: Order[];
}
