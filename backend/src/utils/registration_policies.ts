import { FastifyReply, FastifyRequest } from "fastify";
import { userSchema } from "../types/user_schema.js";
import { ZodError } from "zod";

export async function validateUserData(
  req: FastifyRequest,
  reply: FastifyReply
): Promise<{ email: string; username: string; password: string } | null> {
  const { email, username, password } = req.body as any;

  try {
    return userSchema.parse({ email, username, password });
  } catch (err) {
    if (err instanceof ZodError) {
      const messages = err.issues.map((e) => e.message);

      await reply.code(400).send({
        error: {
          code: "VALIDATION_ERROR",
          messages,
          statusCode: 400,
          timestamp: new Date().toISOString(),
          path: req.url,
        },
      });

      return null;
    }

    throw err;
  }
}
