import { z } from "zod";
import { createSelectSchema } from 'drizzle-zod';
import { roleTable } from "@/lib/db/schema";
import type { RoleKey } from "@/lib/permissions";

const roleSelectSchema = createSelectSchema(roleTable);
export type RoleDB = z.infer<typeof roleSelectSchema>;

export interface Role extends Omit<RoleDB, 'key' | 'created_at' | 'updated_at'> {
    key: RoleKey;
}

export type AdminUserRoleKey = Omit<RoleKey, 'staff'>;
