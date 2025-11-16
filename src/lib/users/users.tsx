import { createServerFn } from "@tanstack/react-start";
import { getCurrentAdminUser } from "@/lib/auth/auth";
import { redirect } from "@tanstack/react-router";
import dbClient from "@/lib/db/client";
import { userTable, roleTable } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { CreateUserData, Role, type Result, type User } from "@/lib/types";
import { canManageUsers, rolesUserCanCreateBasedOnRole, type RoleKey } from "@/lib/permissions";
import { createRandomPassword, hashPassword } from "@/lib/auth/utils";
import { useAdminAppSession } from "@/lib/useAppSession";


export const listUsers = createServerFn({ method: "GET" }).handler(async (): Promise<Result<User[]>> => {
    const session = await getCurrentAdminUser();

    if (session.status !== "SUCCESS") {
        throw redirect({ to: '/admin-login', replace: true });
    }

    const signedInUser = session.data;

    if (!canManageUsers(signedInUser?.role?.key)) {
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

export const createAdminUser = createServerFn({ method: 'POST' }).inputValidator(CreateUserData).handler(async (ctx): Promise<Result<User>> => {
    const db = dbClient();
    const data = ctx.data;

    const existingUser = await db.select().from(userTable).where(eq(userTable.email, data.email)).limit(1);
    if (existingUser.length > 0) {
        return {
            status: "ERROR",
            error: "User already exists",
        };
    }

    const password = createRandomPassword(8);

    const dbRRole = await db.select().from(roleTable).where(eq(roleTable.id, data.role_id)).limit(1);
    if (dbRRole.length === 0) {
        return {
            status: "ERROR",
            error: "Role not found",
        };
    }

    const newUser = {
        id: crypto.randomUUID(),
        name: data.name,
        email: data.email,
        password_hash: await hashPassword(password),
        role_id: data.role_id,
        is_active: false,
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
    }

    return {
        status: "SUCCESS",
        data: user,
    };
});

export const fetchCreateUserInitialData = createServerFn({ method: 'GET' }).handler(async (): Promise<{ roles: Role[] }> => {
    const session = await getCurrentAdminUser();

    if (session.status !== "SUCCESS") {
        throw redirect({ to: '/admin-login', replace: true });
    }

    const signedInUser = session.data;

    if (!canManageUsers(signedInUser?.role?.key)) {
        throw redirect({ to: '/not-authorized', replace: true });
    }

    const db = dbClient();
    const roles = await db.select().from(roleTable).all();

    const availableRoles = roles.filter(role => rolesUserCanCreateBasedOnRole(signedInUser?.role?.key).includes(role.key as RoleKey));

    return {
        roles: availableRoles.map(role => ({
            id: role.id,
            name: role.name,
            description: role.description || '',
            key: role.key as RoleKey,
        })),
    };
});