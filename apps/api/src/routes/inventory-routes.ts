import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { currentUser, requireOwner, requireUser } from '../auth.js';
import { InventoryRepository } from '../repositories/inventory-repository.js';

const adjustmentSchema = z.object({
  delta: z
    .number()
    .finite()
    .refine((value) => value !== 0),
  reason: z.string().trim().min(3).max(120),
});

export function registerInventoryRoutes(
  app: FastifyInstance,
  inventory: InventoryRepository,
): void {
  app.get('/api/inventory', { preHandler: requireUser }, async () => ({ items: inventory.list() }));

  app.post(
    '/api/inventory/:id/adjustments',
    { preHandler: [requireUser, requireOwner] },
    async (request, reply) => {
      if (reply.sent) return;
      const { id } = z.object({ id: z.string().min(1).max(50) }).parse(request.params);
      const { delta, reason } = adjustmentSchema.parse(request.body);
      const item = inventory.adjust(id, delta, reason, currentUser(request).id);
      if (!item) return reply.code(404).send({ message: 'Inventory item was not found.' });
      return item;
    },
  );
}
