import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { z } from "zod";
import type { Result, Role, User } from "@/lib/types";
import type { RoleKey } from "@/lib/permissions";
import dbClient from "@/lib/db/client";
import { roleTable, userTable } from "@/lib/db/schema";
import { rolesUserCanCreateBasedOnRole } from "@/lib/permissions";
import { createRandomPassword, hashPassword } from "@/lib/server/auth/utils";
import { canManageUsersMiddleware } from "@/lib/server/middleware/canManageUsers";

export const CreateUserData = z.object({
    name: z.string().min(2, { message: "Name must be at least 2 characters long" }).max(100, { message: "Name must be at most 100 characters long" }),
    email: z.email(),
    role_id: z.uuid({ message: "Invalid role ID" }),
    is_active: z.boolean(),
});

export const createAdminUser = createServerFn({ method: 'POST' })
    .middleware([canManageUsersMiddleware])
    .inputValidator(CreateUserData)
    .handler(async (ctx): Promise<Result<User>> => {
        const db = dbClient();
        const data = ctx.data;

        const existingUser = await db.select().from(userTable).where(eq(userTable.email, data.email)).limit(1);
        if (existingUser.length > 0) {
            return {
                status: "ERROR",
                error: "User already exists",
            };
        }

        const dbRRole = await db.select().from(roleTable).where(eq(roleTable.id, data.role_id)).limit(1);
        if (dbRRole.length === 0) {
            return {
                status: "ERROR",
                error: "Role not found",
            };
        }

        const password = createRandomPassword(8);

        const newUser = {
            id: crypto.randomUUID(),
            name: data.name,
            email: data.email,
            password_hash: await hashPassword(password),
            role_id: data.role_id,
            is_active: data.is_active,
            created_at: new Date(),
            updated_at: new Date(),
        };

        // log password to console for now
        console.log(`New user created: ${data.email} with password: ${password}`);

        await db.insert(userTable).values(newUser);

        const user = {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            role: {
                id: dbRRole[0].id,
                name: dbRRole[0].name,
                description: dbRRole[0].description || '',
                key: dbRRole[0].key as RoleKey,
            },
            created_at: newUser.created_at,
            updated_at: newUser.updated_at,
            is_active: newUser.is_active,
            last_login_at: new Date(),
            deleted_at: null,
        }

        return {
            status: "SUCCESS",
            data: user,
        };
    });

export const fetchCreateUserInitialData = createServerFn({ method: 'GET' })
    .middleware([canManageUsersMiddleware])
    .handler(async (ctx): Promise<{ roles: Array<Role> }> => {
        const db = dbClient();
        const roles = await db.select().from(roleTable).all();

        const availableRoles = roles.filter(role => rolesUserCanCreateBasedOnRole(ctx.context.user.role?.key).includes(role.key as RoleKey));

        return {
            roles: availableRoles.map(role => ({
                id: role.id,
                name: role.name,
                description: role.description || '',
                key: role.key as RoleKey,
            })),
        };
    });
