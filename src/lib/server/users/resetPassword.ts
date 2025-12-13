import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { canManageUsersMiddleware } from "@/lib/server/middleware/canManageUsers";
import dbClient from "@/lib/db/client";
import { userTable } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createRandomPassword, hashPassword } from "../auth/utils";
import { sendPasswordEmail } from "@/lib/utils/email";

export const resetPassword = createServerFn({ method: 'POST' })
    .inputValidator(
        z.object({
            userId: z.uuid(),
        })
    )
    .middleware([canManageUsersMiddleware])
    .handler(async (ctx) => {
        const db = dbClient();
        const data = ctx.data;

        const existingUser = await db.select().from(userTable).where(eq(userTable.id, data.userId)).limit(1);
        if (existingUser.length === 0) {
            return {
                status: "ERROR",
                error: "User not found",
            };
        }

        const newPassword = createRandomPassword(8);
        const hashedPassword = await hashPassword(newPassword);

        const sendPasswordEmailResult = await sendPasswordEmail(newPassword, existingUser[0].email);
        if (sendPasswordEmailResult.status === 'ERROR') {
            return {
                status: "ERROR",
                error: sendPasswordEmailResult.error || "Failed to send password email",
            };
        }

        await db.update(userTable).set({ password_hash: hashedPassword }).where(eq(userTable.id, data.userId));

        return {
            status: "SUCCESS",
            data: {
                userId: data.userId,
                newPassword,
            },
        };
    })
