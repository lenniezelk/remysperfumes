import { createServerFn } from "@tanstack/react-start";
import { useAdminAppSession } from "@/lib/useAppSession";
import { GoogleAuthData, Result, User } from "@/lib/types";
import dbClient from "@/lib/db/client";
import { roleTable, userTable } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

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

export const loginAdminUser = createServerFn({ method: 'POST' }).inputValidator(GoogleAuthData).handler(async (ctx): Promise<Result<User>> => {
    const db = dbClient();
    const data = ctx.data;

    const dbUser = await db.select().from(userTable).where(eq(userTable.email, data.email)).limit(1);
    if (dbUser.length === 0) {
        return {
            status: "ERROR",
            error: "User not found",
        };
    }

    if (!dbUser[0].is_active) {
        return {
            status: "ERROR",
            error: "User is not active",
        };
    }

    if (!dbUser[0].role_id) {
        return {
            status: "ERROR",
            error: "User has no role assigned",
        };
    }

    const dbRole = await db.select().from(roleTable).where(eq(roleTable.id, dbUser[0].role_id)).limit(1);

    const user: User = {
        id: dbUser[0].id,
        name: dbUser[0].name,
        email: dbUser[0].email,
        role: {
            id: dbRole[0].id,
            name: dbRole[0].name,
        },
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
    return {
        status: "SUCCESS",
        data: null,
    };
});