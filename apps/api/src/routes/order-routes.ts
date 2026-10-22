import { orderStatuses } from '@babelwash/domain';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { currentUser, requireUser } from '../auth.js';
import { OrderRepository } from '../repositories/order-repository.js';
import { OrderService } from '../services/order-service.js';

const createSchema = z.object({
  customerName: z.string().trim().min(2).max(80),
  customerPhone: z.string().regex(/^\+?[0-9]{9,15}$/),
  serviceId: z.string().min(1),
  quantity: z.number().positive().max(100),
  notes: z.string().trim().max(300).optional(),
});
const transitionSchema = z.object({ status: z.enum(orderStatuses) });
const paymentSchema = z.object({
  amount: z.number().int().positive(),
  method: z.enum(['CASH', 'QRIS']),
});

export function registerOrderRoutes(
  app: FastifyInstance,
  orders: OrderRepository,
  service: OrderService,
): void {
  app.get('/api/services', { preHandler: requireUser }, async () => ({ items: orders.services() }));

  app.get('/api/orders', { preHandler: requireUser }, async () => ({ items: orders.list() }));

  app.post('/api/orders', { preHandler: requireUser }, async (request, reply) => {
    const input = createSchema.parse(request.body);
    const order = service.create(
      {
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        serviceId: input.serviceId,
        quantity: input.quantity,
        ...(input.notes ? { notes: input.notes } : {}),
      },
      currentUser(request).id,
    );
    return reply.code(201).send(order);
  });

  app.get('/api/orders/:id', { preHandler: requireUser }, async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const order = orders.findById(id);
    if (!order) return reply.code(404).send({ message: 'Order was not found.' });
    return { order, payments: orders.payments(id), timeline: orders.timeline(id) };
  });

  app.post('/api/orders/:id/status', { preHandler: requireUser }, async (request) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const { status } = transitionSchema.parse(request.body);
    return service.transition(id, status, currentUser(request).id);
  });

  app.post('/api/orders/:id/payments', { preHandler: requireUser }, async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const { amount, method } = paymentSchema.parse(request.body);
    return reply.code(201).send(service.payment(id, amount, method));
  });

  app.get('/api/track/:code', async (request, reply) => {
    const { code } = z.object({ code: z.string().min(8).max(32) }).parse(request.params);
    const order = orders.findByTrackingCode(code.toUpperCase());
    if (!order) return reply.code(404).send({ message: 'Tracking code was not found.' });
    return {
      trackingCode: order.trackingCode,
      customerName: maskName(order.customerName),
      serviceName: order.service.name,
      status: order.status,
      receivedAt: order.receivedAt,
      dueAt: order.dueAt,
      timeline: orders.timeline(order.id),
    };
  });
}

function maskName(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => `${part[0] ?? ''}${'*'.repeat(Math.max(1, part.length - 1))}`)
    .join(' ');
}
