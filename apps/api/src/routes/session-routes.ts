import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireUser, currentUser } from '../auth.js';
import { UserRepository } from '../repositories/user-repository.js';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export function registerSessionRoutes(app: FastifyInstance, users: UserRepository): void {
  app.post('/api/session', async (request, reply) => {
    const input = loginSchema.parse(request.body);
    const user = users.authenticate(input.email, input.password);
    if (!user) return reply.code(401).send({ message: 'Email or password is incorrect.' });
    const token = app.jwt.sign(user, { expiresIn: '8h' });
    return { token, user };
  });

  app.get('/api/session', { preHandler: requireUser }, async (request) => ({
    user: currentUser(request),
  }));
}
