import type { FastifyReply, FastifyRequest } from 'fastify';
import type { SessionUser } from './types.js';

export async function requireUser(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  try {
    await request.jwtVerify();
  } catch {
    await reply.code(401).send({ message: 'A valid staff session is required.' });
  }
}

export function currentUser(request: FastifyRequest): SessionUser {
  return request.user as SessionUser;
}

export async function requireOwner(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  if (currentUser(request).role !== 'OWNER') {
    await reply.code(403).send({ message: 'Owner access is required.' });
  }
}
