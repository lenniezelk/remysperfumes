import { z } from "zod";
import { createSelectSchema } from 'drizzle-zod';
import { roleTable, userTable } from "./db/schema";

export type RoleKey = 'superadmin' | 'admin' | 'manager' | 'staff';
export type AdminUserRoleKey = Omit<RoleKey, 'staff'>;

const roleSelectSchema = createSelectSchema(roleTable);
export type RoleDB = z.infer<typeof roleSelectSchema>;

export interface Role extends Omit<RoleDB, 'key' | 'created_at' | 'updated_at'> {
    key: RoleKey;
}

const userSelectSchema = createSelectSchema(userTable);

export type UserDB = z.infer<typeof userSelectSchema>;

export interface User extends Omit<UserDB, 'role_id' | 'password_hash'> {
    role: Role | null;
}

export interface AdminAppSession {
    user: User | null;
}

export type Result<T> = {
    status: "SUCCESS",
    data: T;
} | {
    status: "ERROR",
    error: string;
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