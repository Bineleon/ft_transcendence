import type { FastifyInstance } from 'fastify';
import { SnakeService } from './snake.service.js';
import { snakeController } from './snake.controller.js';

export function registerSnakeRoutes(app: FastifyInstance) {
  const snakeService = new SnakeService();
  snakeController(app, snakeService);
}

export { SnakeService } from './snake.service.js';
export * from './snake.model.js';
