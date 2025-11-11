import { z } from "zod";

export type RoleKey = 'superadmin' | 'admin' | 'manager' | 'staff';

export interface Role {
    id: string;
    name: string; // user readable name
    description: string; // user readable description
    key: RoleKey; // internal key
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
    CLOUDFLARE_TURNSTILE_SECRET: string;
};

export const CreateUserData = z.object({
    name: z.string().min(2, { message: "Name must be at least 2 characters long" }).max(100, { message: "Name must be at most 100 characters long" }),
    email: z.email(),
    role_id: z.uuid({ message: "Invalid role ID" }),
    // password: z.string().min(8).max(100).regex(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&+\-_=.,;:'"\[\]{}()]/, "Password must be at least 8 characters long and contain at least one letter and one number"),
});

export const LoginAdminUserInput = z.object({
    email: z.email(),
    password: z.string(),
});