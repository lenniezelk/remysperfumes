import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { z } from "zod";
import type { Result, User, UserUpdateData } from "@/lib/types";
import type { RoleKey } from "@/lib/permissions";
import dbClient from "@/lib/db/client";
import { roleTable, userTable } from "@/lib/db/schema";
import { createRandomPassword, hashPassword } from "@/lib/server/auth/utils";
import { canManageUsersMiddleware } from "@/lib/server/middleware/canManageUsers";

export const UpdateUserData = z.object({
    userId: z.uuid(),
    name: z.string().min(2, { message: "Name must be at least 2 characters long" }).max(100, { message: "Name must be at most 100 characters long" }),
    email: z.email(),
    role_id: z.uuid({ message: "Invalid role ID" }),
    is_active: z.boolean(),
    createNewPassword: z.boolean(),
    delete_user: z.boolean(),
    restore_user: z.boolean(),
});

export const updateAdminUser = createServerFn({ method: 'POST' })
    .middleware([canManageUsersMiddleware])
    .inputValidator(UpdateUserData)
    .handler(async (ctx): Promise<Result<User>> => {
        const db = dbClient();
        const data = ctx.data;

        const existingUser = await db.select().from(userTable).where(eq(userTable.id, data.userId)).limit(1);
        if (existingUser.length === 0) {
            return {
                status: "ERROR",
                error: "User not found",
            };
        }

        // check if user with email already exists
        const userWithEmail = await db.select().from(userTable).where(eq(userTable.email, data.email)).limit(1);
        if (userWithEmail.length > 0 && userWithEmail[0].id !== data.userId) {
            return {
                status: "ERROR",
                error: "Another user with this email already exists",
            };
        }

        const dbRole = await db.select().from(roleTable).where(eq(roleTable.id, data.role_id)).limit(1);
        if (dbRole.length === 0) {
            return {
                status: "ERROR",
                error: "Role not found",
            };
        }

        if (existingUser[0].id === ctx.context.user.id) {
            return {
                status: "ERROR",
                error: "You cannot update your own user account through this interface, go to your profile settings instead.",
            };
        }

        const updatedUserData: UserUpdateData = {
            name: data.name,
            email: data.email,
            role_id: data.role_id,
            is_active: data.is_active,
            updated_at: new Date(),
            deleted_at: data.delete_user ? new Date() : (data.restore_user ? null : existingUser[0].deleted_at),
        };

        if (data.createNewPassword) {
            const newPassword = createRandomPassword(8);
            updatedUserData.password_hash = await hashPassword(newPassword);
            // log new password to console for now
            console.log(`User ${data.email} password updated to: ${newPassword}`);
        }

        await db.update(userTable).set(updatedUserData).where(eq(userTable.id, data.userId));

        const updatedUser: User = {
            id: existingUser[0].id,
            name: updatedUserData.name!,
            email: updatedUserData.email!,
            role: {
                id: dbRole[0].id,
                name: dbRole[0].name,
                description: dbRole[0].description || '',
                key: dbRole[0].key as RoleKey,
            },
            created_at: existingUser[0].created_at,
            updated_at: updatedUserData.updated_at!,
            is_active: updatedUserData.deleted_at ? false : updatedUserData.is_active!,
            last_login_at: existingUser[0].last_login_at,
            deleted_at: updatedUserData.deleted_at || null,
        };

        return {
            status: "SUCCESS",
            data: updatedUser,
        }
    });
