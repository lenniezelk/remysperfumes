import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { z } from "zod";
import type { Result } from "@/lib/types";
import dbClient from "@/lib/db/client";
import { userTable } from "@/lib/db/schema";
import { canManageUsersMiddleware } from "@/lib/server/middleware/canManageUsers";

export const DeleteUserInput = z.object({
    userId: z.uuid(),
});

export const deleteAdminUser = createServerFn({ method: 'POST' })
    .middleware([canManageUsersMiddleware])
    .inputValidator(DeleteUserInput)
    .handler(async (ctx): Promise<Result<null>> => {
        const db = dbClient();
        const { userId } = ctx.data;

        const existingUser = await db.select().from(userTable).where(eq(userTable.id, userId)).limit(1);
        if (existingUser.length === 0) {
            return {
                status: "ERROR",
                error: "User not found",
            };
        }

        // Prevent deleting yourself
        if (existingUser[0].id === ctx.context.user.id) {
            return {
                status: "ERROR",
                error: "You cannot delete your own user account.",
            };
        }

        // Soft delete: set deleted_at to current timestamp
        await db.update(userTable)
            .set({
                deleted_at: new Date(),
                updated_at: new Date(),
            })
            .where(eq(userTable.id, userId));

        return {
            status: "SUCCESS",
            data: null,
        };
    });

export const RestoreUserInput = z.object({
    userId: z.uuid(),
});

export const restoreAdminUser = createServerFn({ method: 'POST' })
    .middleware([canManageUsersMiddleware])
    .inputValidator(RestoreUserInput)
    .handler(async (ctx): Promise<Result<null>> => {
        const db = dbClient();
        const { userId } = ctx.data;

        const existingUser = await db.select().from(userTable).where(eq(userTable.id, userId)).limit(1);
        if (existingUser.length === 0) {
            return {
                status: "ERROR",
                error: "User not found",
            };
        }

        // Restore user: set deleted_at to null
        await db.update(userTable)
            .set({
                deleted_at: null,
                updated_at: new Date(),
            })
            .where(eq(userTable.id, userId));

        return {
            status: "SUCCESS",
            data: null,
        };
    });
