import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import { DomainError } from '@babelwash/domain';
import Fastify, { type FastifyInstance } from 'fastify';
import { ZodError } from 'zod';
import type { AppConfig } from './config.js';
import { openDatabase } from './infrastructure/database.js';
import { InventoryRepository } from './repositories/inventory-repository.js';
import { OrderRepository } from './repositories/order-repository.js';
import { UserRepository } from './repositories/user-repository.js';
import { registerDashboardRoutes } from './routes/dashboard-routes.js';
import { registerInventoryRoutes } from './routes/inventory-routes.js';
import { registerOrderRoutes } from './routes/order-routes.js';
import { registerSessionRoutes } from './routes/session-routes.js';
import { OrderService } from './services/order-service.js';

export async function buildApp(config: AppConfig): Promise<FastifyInstance> {
  const app = Fastify({ logger: { level: process.env.BABELWASH_LOG_LEVEL ?? 'info' } });
  await app.register(cors, { origin: config.BABELWASH_WEB_ORIGIN });
  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(jwt, { secret: config.BABELWASH_JWT_SECRET });

  const database = openDatabase(
    config.BABELWASH_DATABASE_PATH,
    config.BABELWASH_RESET_DATABASE === 'true',
  );
  const orders = new OrderRepository(database);
  const inventory = new InventoryRepository(database);
  const users = new UserRepository(database);
  const orderService = new OrderService(orders);

  app.get('/health', async () => ({ status: 'ok' }));
  registerSessionRoutes(app, users);
  registerDashboardRoutes(app, orders, inventory);
  registerOrderRoutes(app, orders, orderService);
  registerInventoryRoutes(app, inventory);

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof ZodError) {
      return reply.code(400).send({ message: 'Request validation failed.', issues: error.issues });
    }
    if (error instanceof DomainError) {
      return reply.code(409).send({ message: error.message });
    }
    app.log.error(error instanceof Error ? error : new Error('Unknown server error'));
    return reply.code(500).send({ message: 'Unexpected server error.' });
  });

  app.addHook('onClose', async () => database.close());
  return app;
}
