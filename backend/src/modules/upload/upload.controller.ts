import type { FastifyInstance } from 'fastify';
import { authenticate } from '../../shared/middleware/authentication.js';
import fs from 'node:fs';
import path from 'node:path';
import { getPrismaClient } from '../../shared/database/prisma.js';

const prisma = getPrismaClient();

export async function avatarRoutes(fastify: FastifyInstance) {
  fastify.post('/api/users/me/avatar', { preHandler: authenticate }, async (request, reply) => {
    const userId = request.user!.userId;

    try {
      // Récup du fichier
      const data = await request.file();
      if (!data) {
        return reply.status(400).send({ success: false, message: "Aucun fichier envoyé" });
      }

      // Sécurité mimetype
      if (!data.mimetype.startsWith("image/")) {
        return reply.status(400).send({ success: false, message: "Type de fichier non supporté" });
      }

      const MAX_SIZE = 2 * 1024 * 1024;
      if (data.file.truncated || data.file.bytesRead > MAX_SIZE) {
        return reply.status(400).send({ success: false, message: "Image trop grande" });
      }

      // Nom unique pour casser le cache
      const ext = path.extname(data.filename);
      const filename = `${userId}_${Date.now()}${ext}`;

      const avatarsDir = '/app/avatars';
      if (!fs.existsSync(avatarsDir)) {
        fs.mkdirSync(avatarsDir, { recursive: true });
      }

      const filepath = path.join(avatarsDir, filename);

      // Sauvegarde du fichier
      const fileStream = fs.createWriteStream(filepath);
      await new Promise<void>((resolve, reject) => {
        data.file.pipe(fileStream);
        data.file.on('end', () => resolve());
        data.file.on('error', reject);
      });

      // Mise à jour DB
      const avatarUrl = `/avatars/${filename}`;
      await prisma.user.update({
        where: { id: userId },
        data: { avatarUrl }
      });

      return reply.status(200).send({
        success: true,
        data: { avatarUrl }
      });
    } catch (err) {
      console.error("Erreur upload avatar:", err);
      return reply.status(500).send({ success: false, message: "Erreur serveur" });
    }
  });
}
