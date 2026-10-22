import type { FastifyInstance } from 'fastify';
import { requireUser } from '../auth.js';
import { InventoryRepository } from '../repositories/inventory-repository.js';
import { OrderRepository } from '../repositories/order-repository.js';

export function registerDashboardRoutes(
  app: FastifyInstance,
  orders: OrderRepository,
  inventory: InventoryRepository,
): void {
  app.get('/api/dashboard', { preHandler: requireUser }, async () => {
    const all = orders.list();
    const active = all.filter((order) => !['COLLECTED', 'CANCELLED'].includes(order.status));
    return {
      activeOrders: active.length,
      readyOrders: all.filter((order) => order.status === 'READY').length,
      outstandingAmount: all.reduce(
        (sum, order) => sum + Math.max(0, order.totalAmount - order.paidAmount),
        0,
      ),
      dueSoon: active.filter((order) => new Date(order.dueAt).getTime() < Date.now() + 86_400_000)
        .length,
      lowStock: inventory.list().filter((item) => item.isLow),
      recentOrders: all.slice(0, 5),
    };
  });
}
