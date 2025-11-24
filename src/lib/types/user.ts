import { createSelectSchema, createUpdateSchema } from 'drizzle-zod';
import type { z } from "zod";
import type { Role } from "./role";
import { userTable } from "@/lib/db/schema";

const userSelectSchema = createSelectSchema(userTable);
export type UserDB = z.infer<typeof userSelectSchema>;

export interface User extends Omit<UserDB, 'role_id' | 'password_hash'> {
    role: Role | null;
}

export interface UserWithPermissions extends User {
    canEditOrDelete: boolean;
}

const userUpdateSchema = createUpdateSchema(userTable);
export type UserUpdateData = Omit<z.infer<typeof userUpdateSchema>, 'id' | 'created_at'>;
