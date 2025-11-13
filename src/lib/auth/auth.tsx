import { createServerFn } from "@tanstack/react-start";
import { useAdminAppSession } from "@/lib/useAppSession";
import { Result, CreateUserData, User, RoleKey, Role, LoginAdminUserInput } from "@/lib/types";
import dbClient from "@/lib/db/client";
import { roleTable, userTable } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createRandomPassword, hashPassword, verifyPassword } from "./utils";
import { redirect } from "@tanstack/react-router";

export const getCurrentAdminUser = createServerFn({ method: 'GET' }).handler(async (): Promise<Result<User>> => {
    const session = await useAdminAppSession();
    if (!session?.data?.user) {
        return {
            status: "ERROR",
            error: "No user logged in",
        };
    }
    return {
        status: "SUCCESS",
        data: session.data.user,
    };
});

export const loginAdminUser = createServerFn({ method: 'POST' }).inputValidator(LoginAdminUserInput).handler(async (ctx): Promise<Result<User>> => {
    const db = dbClient();
    const data = ctx.data;

    const errorMessage = "Invalid email or password or user is not active";

    let dbUser = await db.select().from(userTable).where(eq(userTable.email, data.email)).limit(1);
    if (dbUser.length === 0) {
        return {
            status: "ERROR",
            error: errorMessage,
        };
    }

    if (!dbUser[0].is_active) {
        return {
            status: "ERROR",
            error: errorMessage,
        };
    }

    if (!dbUser[0].role_id) {
        return {
            status: "ERROR",
            error: errorMessage,
        };
    }

    if (dbUser[0].password_hash === null) {
        return {
            status: "ERROR",
            error: errorMessage,
        };
    }

    if (!(await verifyPassword(data.password, dbUser[0].password_hash || ''))) {
        return {
            status: "ERROR",
            error: errorMessage,
        };
    }

    const dbRole = await db.select().from(roleTable).where(eq(roleTable.id, dbUser[0].role_id)).limit(1);

    if (dbRole.length === 0) {
        return {
            status: "ERROR",
            error: errorMessage,
        };
    }

    await db.update(userTable).set({ last_login_at: new Date() }).where(eq(userTable.id, dbUser[0].id));
    dbUser = await db.select().from(userTable).where(eq(userTable.id, dbUser[0].id)).limit(1);

    const user: User = {
        id: dbUser[0].id,
        name: dbUser[0].name,
        email: dbUser[0].email,
        role: {
            id: dbRole[0].id,
            name: dbRole[0].name,
            description: dbRole[0].description || '',
            key: dbRole[0].key as RoleKey,
        },
        created_at: dbUser[0].created_at,
        updated_at: dbUser[0].updated_at,
        is_active: dbUser[0].is_active,
        last_login_at: dbUser[0].last_login_at,
    };

    const session = await useAdminAppSession();

    await session.update({
        user,
    });

    return {
        status: "SUCCESS",
        data: user,
    };
});

export const logoutAdminUser = createServerFn({ method: 'POST' }).handler(async (): Promise<Result<null>> => {
    const session = await useAdminAppSession();
    await session.clear();
    throw redirect({ to: '/admin-login', replace: true });
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

    const session = await useAdminAppSession();
    await session.update({
        user,
    });

    return {
        status: "SUCCESS",
        data: user,
    };
});

export const fetchCreateUserInitialData = createServerFn({ method: 'GET' }).handler(async (): Promise<{ roles: Role[] }> => {
    const db = dbClient();
    const roles = await db.select().from(roleTable).all();

    return {
        roles: roles.map(role => ({
            id: role.id,
            name: role.name,
            description: role.description || '',
            key: role.key as RoleKey,
        })),
    };
});