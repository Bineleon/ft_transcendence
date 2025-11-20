import type { FastifyInstance } from 'fastify';
import { FriendsService } from './friends.service.js';
import { friendsController } from './friends.controller.js';

export function setupFriendsModule(app: FastifyInstance) {
  const service = new FriendsService();
  friendsController(app, service);
}
