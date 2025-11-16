import { createServerFn } from "@tanstack/react-start";
import { useAdminAppSession } from "@/lib/useAppSession";
import { Result, User, LoginAdminUserInput } from "@/lib/types";
import { RoleKey } from "@/lib/permissions";
import dbClient from "@/lib/db/client";
import { roleTable, userTable } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { verifyPassword } from "./utils";
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

    const now = new Date();

    await db.update(userTable).set({ last_login_at: now }).where(eq(userTable.id, dbUser[0].id));

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
        last_login_at: now,
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

