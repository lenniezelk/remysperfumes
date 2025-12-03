import { createServerFn } from "@tanstack/react-start";
import { desc, eq } from "drizzle-orm";
import type { Result, UserWithPermissions } from "@/lib/types";
import type { RoleKey } from "@/lib/permissions";
import dbClient from "@/lib/db/client";
import { roleTable, userTable } from "@/lib/db/schema";
import { canEditOrDeleteUser } from "@/lib/permissions";
import { canManageUsersMiddleware } from "@/lib/server/middleware/canManageUsers";

export const listUsers = createServerFn({ method: "GET" })
    .middleware([canManageUsersMiddleware])
    .handler(async (ctx): Promise<Result<Array<UserWithPermissions>>> => {
        const db = dbClient();

        const users = await db
            .select()
            .from(userTable)
            .leftJoin(roleTable, eq(userTable.role_id, roleTable.id))
            .orderBy(desc(userTable.created_at));

        return {
            status: "SUCCESS",
            data: users.map(({ User, Role }) => ({
                id: User.id,
                name: User.name,
                email: User.email,
                role: Role
                    ? {
                        id: Role.id,
                        name: Role.name,
                        description: Role.description,
                        key: Role.key as RoleKey,
                    }
                    : null,
                created_at: User.created_at,
                updated_at: User.updated_at,
                is_active: User.is_active,
                last_login_at: User.last_login_at,
                deleted_at: User.deleted_at,
                canEditOrDelete: canEditOrDeleteUser(ctx.context.user.role?.key, Role ? (Role.key as RoleKey) : undefined),
            })),
        }
    });
