import { z } from "zod";
import type { User } from "./user";

export const GoogleAuthData = z.object({
    email: z.email(),
    name: z.string(),
    emailVerified: z.boolean().optional(),
});

export type GoogleAuthData = z.infer<typeof GoogleAuthData>;

export interface AdminAppSession {
    user: User | null;
}

export const LoginAdminUserInput = z.object({
    email: z.email(),
    password: z.string(),
});

export type LoginAdminUserInput = z.infer<typeof LoginAdminUserInput>;
