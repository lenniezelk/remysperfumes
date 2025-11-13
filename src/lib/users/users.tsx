import { createServerFn } from "@tanstack/react-start";
import { getCurrentAdminUser } from "@/lib/auth/auth";
import { redirect } from "@tanstack/react-router";
import dbClient from "@/lib/db/client";
import { userTable, roleTable } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { canListUsers } from "@/lib/users/permissions";
import type { Result, RoleKey, User } from "@/lib/types";


export const listUsers = createServerFn({ method: "GET" }).handler(async (): Promise<Result<User[]>> => {
    const session = await getCurrentAdminUser();

    if (session.status !== "SUCCESS") {
        throw redirect({ to: '/admin-login', replace: true });
    }

    const signedInUser = session.data;

    if (!canListUsers(signedInUser?.role?.key)) {
        throw redirect({ to: '/not-authorized', replace: true });
    }

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
        })),
    }
});