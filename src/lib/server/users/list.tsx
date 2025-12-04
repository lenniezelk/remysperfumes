import { createServerFn } from "@tanstack/react-start";
import { and, desc, eq, like, isNotNull, isNull, SQL, count, asc } from "drizzle-orm";
import type { RoleKey } from "@/lib/permissions";
import dbClient from "@/lib/db/client";
import { roleTable, userTable } from "@/lib/db/schema";
import { canEditOrDeleteUser } from "@/lib/permissions";
import { canManageUsersMiddleware } from "@/lib/server/middleware/canManageUsers";
import { z } from "zod";
import type { PaginatedListResponse } from "@/lib/types/common";
import { UserWithPermissions } from "@/lib/types";

export const ListUsersParams = z.object({
    searchQuery: z.string().default(""),
    role: z.uuid().optional(),
    is_active: z.boolean().optional(),
    sort: z.enum(["name", "created_at"]).default("created_at"),
    order: z.enum(["asc", "desc"]).default("desc"),
    page: z.int().nonnegative().default(1),
    limit: z.int().nonnegative().default(10),
    showDeleted: z.boolean().default(false),
})

export const listUsers = createServerFn({ method: "GET" })
    .middleware([canManageUsersMiddleware])
    .inputValidator(ListUsersParams)
    .handler(async (ctx) => {
        const db = dbClient();
        const params = ctx.data;

        const filters: SQL[] = [];

        if (params.showDeleted) {
            filters.push(isNotNull(userTable.deleted_at));
        } else {
            filters.push(isNull(userTable.deleted_at));
        }

        if (params.searchQuery) {
            filters.push(like(userTable.name, `%${params.searchQuery}%`));
        }

        if (params.role) {
            filters.push(eq(userTable.role_id, params.role));
        }

        if (params.is_active) {
            filters.push(eq(userTable.is_active, params.is_active));
        }

        const orderBy: SQL[] = [];

        if (params.sort && params.order) {
            if (params.sort === "name") {
                orderBy.push(params.order === "asc" ? asc(userTable.name) : desc(userTable.name));
            } else if (params.sort === "created_at") {
                orderBy.push(params.order === "asc" ? asc(userTable.created_at) : desc(userTable.created_at));
            }
        }

        const page = params.page || 1;
        const limit = params.limit || 10;
        const offset = (page - 1) * limit;

        const users = await db
            .select()
            .from(userTable)
            .leftJoin(roleTable, eq(userTable.role_id, roleTable.id))
            .where(and(...filters))
            .orderBy(...orderBy)
            .limit(limit)
            .offset(offset);

        const total = await db
            .select({ count: count() })
            .from(userTable)
            .where(and(...filters));

        return {
            status: "SUCCESS",
            data: {
                items: users.map(({ User, Role }) => ({
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
                total: total[0].count,
                page,
                limit,
                offset,
            } satisfies PaginatedListResponse<UserWithPermissions>
        }
    });
