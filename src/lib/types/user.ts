import { z } from "zod";
import { createSelectSchema, createUpdateSchema } from 'drizzle-zod';
import { userTable } from "@/lib/db/schema";
import type { Role } from "./role";

const userSelectSchema = createSelectSchema(userTable);
export type UserDB = z.infer<typeof userSelectSchema>;

export interface User extends Omit<UserDB, 'role_id' | 'password_hash'> {
    role: Role | null;
}

const userUpdateSchema = createUpdateSchema(userTable);
export type UserUpdateData = z.infer<typeof userUpdateSchema>;
