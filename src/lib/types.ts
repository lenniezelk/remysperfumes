import { z } from "zod";

export interface Role {
    id: string;
    name: string;
}

export interface User {
    id: string;
    name: string;
    email: string;
    role: Role;
}

export interface AdminAppSession {
    user: User | null;
}

export interface Result<T> {
    status: "SUCCESS" | "ERROR";
    data?: T;
    error?: string;
}

export const GoogleAuthData = z.object({
    email: z.string().email(),
    name: z.string(),
    emailVerified: z.boolean().optional(),
});

export type GoogleAuthData = z.infer<typeof GoogleAuthData>;

export interface EnvVars {
    GOOGLE_OAUTH_CLIENT_ID: string;
};