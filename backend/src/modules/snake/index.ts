import type { FastifyInstance } from 'fastify';
import { SnakeService } from './snake.service.js';
import { snakeController } from './snake.controller.js';
import { UserService } from '../users/users.service.js';

export function registerSnakeRoutes(app: FastifyInstance) {
  const snakeService = new SnakeService();
  const userService = new UserService();
  snakeController(app, snakeService, userService);
}

export { SnakeService } from './snake.service.js';
export * from './snake.model.js';
