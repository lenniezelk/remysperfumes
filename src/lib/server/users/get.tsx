import { createServerFn } from "@tanstack/react-start";
import { redirect } from "@tanstack/react-router";
import { eq } from "drizzle-orm";
import { z } from "zod";
import type { Result, Role, User } from "@/lib/types";
import type { RoleKey } from "@/lib/permissions";
import dbClient from "@/lib/db/client";
import { roleTable, userTable } from "@/lib/db/schema";
import { canEditOrDeleteUser, rolesUserCanCreateBasedOnRole } from "@/lib/permissions";
import { canManageUsersMiddleware } from "@/lib/server/middleware/canManageUsers";

export const FetchUserByIdInput = z.object({
    userId: z.uuid(),
});

export const fetchEditUserInitialData = createServerFn({ method: 'GET' })
    .middleware([canManageUsersMiddleware])
    .inputValidator(FetchUserByIdInput)
    .handler(async (ctx): Promise<Result<{ user: User; roles: Array<Role> }>> => {
        const userId = ctx.data.userId;

        const db = dbClient();
        const users = await db
            .select()
            .from(userTable)
            .leftJoin(roleTable, eq(userTable.role_id, roleTable.id))
            .where(eq(userTable.id, userId))
            .limit(1);

        if (users.length === 0) {
            return {
                status: "ERROR",
                error: "User not found",
            };
        }

        if (!canEditOrDeleteUser(ctx.context.user.role?.key, users[0].Role ? (users[0].Role.key as RoleKey) : undefined)) {
            throw redirect({ to: '/not-authorized', replace: true });
        }

        const { User: dbUser, Role: dbRole } = users[0];

        const dbRoles = await db.select().from(roleTable).all();
        const availableRoles = dbRoles.filter(role => rolesUserCanCreateBasedOnRole(ctx.context.user.role?.key).includes(role.key as RoleKey));

        const user: User = {
            id: dbUser.id,
            name: dbUser.name,
            email: dbUser.email,
            role: dbRole
                ? {
                    id: dbRole.id,
                    name: dbRole.name,
                    description: dbRole.description || '',
                    key: dbRole.key as RoleKey,
                }
                : null,
            created_at: dbUser.created_at,
            updated_at: dbUser.updated_at,
            is_active: dbUser.is_active,
            last_login_at: dbUser.last_login_at,
            deleted_at: dbUser.deleted_at,
        };

        return {
            status: "SUCCESS",
            data: {
                user,
                roles: availableRoles.map(role => ({
                    id: role.id,
                    name: role.name,
                    description: role.description || '',
                    key: role.key as RoleKey,
                })),
            },
        };
    });
