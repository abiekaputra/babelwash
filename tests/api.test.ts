import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../apps/api/src/app.js';

const directory = mkdtempSync(join(tmpdir(), 'babelwash-'));
let app: FastifyInstance;
let token = '';

beforeAll(async () => {
  app = await buildApp({
    BABELWASH_API_PORT: 4310,
    BABELWASH_WEB_ORIGIN: 'http://127.0.0.1:4311',
    BABELWASH_DATABASE_PATH: join(directory, 'test.db'),
    BABELWASH_JWT_SECRET: 'integration-test-secret-with-32-characters',
    BABELWASH_RESET_DATABASE: 'true',
  });
  const login = await app.inject({
    method: 'POST',
    url: '/api/session',
    payload: { email: 'owner@babelwash.local', password: 'washday123' },
  });
  token = login.json<{ token: string }>().token;
});

afterAll(async () => {
  await app.close();
  rmSync(directory, { recursive: true, force: true });
});

describe('BabelWash API', () => {
  it('rejects a protected request without a staff session', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/orders' });
    expect(response.statusCode).toBe(401);
  });

  it('completes the order, payment, and public tracking flow', async () => {
    const created = await app.inject({
      method: 'POST',
      url: '/api/orders',
      headers: auth(),
      payload: {
        customerName: 'Ari Customer',
        customerPhone: '081234567890',
        serviceId: 'wash-fold',
        quantity: 2,
      },
    });
    expect(created.statusCode).toBe(201);
    const order = created.json<{ id: string; trackingCode: string; totalAmount: number }>();
    expect(order.totalAmount).toBe(24_000);

    for (const status of ['WASHING', 'DRYING', 'READY']) {
      const response = await app.inject({
        method: 'POST',
        url: `/api/orders/${order.id}/status`,
        headers: auth(),
        payload: { status },
      });
      expect(response.statusCode).toBe(200);
    }

    const blocked = await app.inject({
      method: 'POST',
      url: `/api/orders/${order.id}/status`,
      headers: auth(),
      payload: { status: 'COLLECTED' },
    });
    expect(blocked.statusCode).toBe(409);

    const payment = await app.inject({
      method: 'POST',
      url: `/api/orders/${order.id}/payments`,
      headers: auth(),
      payload: { amount: 24_000, method: 'QRIS' },
    });
    expect(payment.statusCode).toBe(201);

    const collected = await app.inject({
      method: 'POST',
      url: `/api/orders/${order.id}/status`,
      headers: auth(),
      payload: { status: 'COLLECTED' },
    });
    expect(collected.statusCode).toBe(200);

    const tracked = await app.inject({ method: 'GET', url: `/api/track/${order.trackingCode}` });
    expect(tracked.statusCode).toBe(200);
    expect(tracked.json<{ status: string; customerName: string }>().status).toBe('COLLECTED');
    expect(tracked.json<{ customerName: string }>().customerName).not.toContain('Customer');
  });

  it('records an owner stock adjustment and blocks negative inventory', async () => {
    const adjusted = await app.inject({
      method: 'POST',
      url: '/api/inventory/detergent/adjustments',
      headers: auth(),
      payload: { delta: 2, reason: 'Local stock receipt' },
    });
    expect(adjusted.statusCode).toBe(200);

    const blocked = await app.inject({
      method: 'POST',
      url: '/api/inventory/detergent/adjustments',
      headers: auth(),
      payload: { delta: -999, reason: 'Invalid removal' },
    });
    expect(blocked.statusCode).toBe(409);
  });
});

function auth() {
  return { authorization: `Bearer ${token}` };
}
