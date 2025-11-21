// src/friends/friends.controller.ts
import type { FastifyInstance } from 'fastify';
import { authenticate } from '../../shared/middleware/authentication.js';
import type { FriendsService } from './friends.service.js';

export function friendsController(app: FastifyInstance, friendsService: FriendsService) {
  // ---------------------------------------------
  // 1️⃣ Envoyer une demande d'ami
  // ---------------------------------------------
  app.post<{ Body: { username: string } }>(
    '/api/friends/request',
    { preHandler: authenticate },
    async (request) => {
      const userId = request.user!.userId;
      const { username } = request.body;
      const friendRequest = await friendsService.sendFriendRequest(userId, username);
      return { success: true, data: friendRequest };
    }
  );

  // ---------------------------------------------
  // 2️⃣ Accepter ou refuser une demande
  // ---------------------------------------------
  app.patch<{ Params: { friendId: string }; Body: { action: 'accept' | 'reject' } }>(
    '/api/friends/:friendId',
    { preHandler: authenticate },
    async (request) => {
      const { friendId } = request.params;
      const { action } = request.body;
      const userId = request.user!.userId;

      const result = await friendsService.handleRequest(userId, friendId, action);
      return { success: true, data: result };
    }
  );

  // ---------------------------------------------
  // 3️⃣ Liste d'amis
  // ---------------------------------------------
  app.get(
    '/api/friends',
    { preHandler: authenticate },
    async (request) => {
      const userId = request.user!.userId;
      const friends = await friendsService.getFriends(userId);
      return { success: true, data: friends };
    }
  );

  // ---------------------------------------------
  // 4️⃣ Supprimer un ami
  // ---------------------------------------------
  app.delete<{ Params: { friendId: string } }>(
    '/api/friends/:friendId',
    { preHandler: authenticate },
    async (request) => {
      const { friendId } = request.params;
      const userId = request.user!.userId;

      await friendsService.removeFriend(userId, friendId);
      return { success: true, message: 'Friend removed' };
    }
  );

  // ---------------------------------------------
  // 5️⃣ Récupérer les demandes reçues
  // ---------------------------------------------
  app.get(
    '/api/friends/requests',
    { preHandler: authenticate },
    async (request) => {
      const userId = request.user!.userId;
      const requests = await friendsService.getRequests(userId);
      return { success: true, data: requests };
    }
  );
}
