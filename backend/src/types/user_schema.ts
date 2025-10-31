import { z } from "zod";

// Regex pour mot de passe fort : min 8 caractères, 1 maj, 1 min, 1 chiffre
const strongPassword = new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$");

export const userSchema = z.object({
  email: z.string()
    .email({ message: "Email invalide" })
    .max(255, "Email trop long"),

  username: z.string()
    .min(3, "Nom d'utilisateur trop court")
    .max(20, "Nom d'utilisateur trop long")
    .regex(/^[a-zA-Z0-9_]+$/, "Le nom d'utilisateur ne doit contenir que des lettres, chiffres ou underscores"),

  password: z.string()
    .regex(strongPassword, "Mot de passe trop faible"),
});

export type UserSchema = z.infer<typeof userSchema>;
