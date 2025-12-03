import { createServerFn } from "@tanstack/react-start";
import { eq, InferInsertModel } from "drizzle-orm";
import { z } from "zod";
import type { Result, User } from "@/lib/types";
import type { RoleKey } from "@/lib/permissions";
import dbClient from "@/lib/db/client";
import { roleTable, userTable } from "@/lib/db/schema";
import { hashPassword, verifyPassword, strongPasswordRegex } from "@/lib/server/auth/utils";
import { isAdminMiddleware } from "@/lib/server/middleware/isAdmin";

export const UpdateProfileData = z.object({
    name: z.string().min(2, { message: "Name must be at least 2 characters long" }).max(100, { message: "Name must be at most 100 characters long" }),
    email: z.email(),
    current_password: z.string().min(1, { message: "Current password is required" }),
    new_password: z.string(),
    confirm_password: z.string(),
}).refine((data) => {
    // If new_password is provided, confirm_password must match
    if (data.new_password && data.new_password.length > 0) {
        return data.new_password === data.confirm_password;
    }
    return true;
}, {
    message: "Passwords do not match",
    path: ["confirm_password"],
}).refine((data) => {
    // If new_password is provided, it must be at least 8 characters
    if (data.new_password && data.new_password.length > 0) {
        return data.new_password.length >= 8;
    }
    return true;
}, {
    message: "New password must be at least 8 characters long",
    path: ["new_password"],
}).refine((data) => {
    // If new_password is provided, it must meet strength requirements
    if (data.new_password && data.new_password.length > 0) {
        return strongPasswordRegex.test(data.new_password);
    }
    return true;
}, {
    message: "Password must contain at least one letter, one number, and one special character",
    path: ["new_password"],
});

export const updateProfile = createServerFn({ method: 'POST' })
    .middleware([isAdminMiddleware])
    .inputValidator(UpdateProfileData)
    .handler(async (ctx): Promise<Result<User>> => {
        const db = dbClient();
        const data = ctx.data;

        const currentUser = ctx.context.user;

        // Get user from database
        const dbUser = await db.select().from(userTable).where(eq(userTable.id, currentUser.id)).limit(1);
        if (dbUser.length === 0) {
            return {
                status: "ERROR",
                error: "User not found",
            };
        }

        if (!dbUser[0].password_hash) {
            console.error("User password hash not found");
            return {
                status: "ERROR",
                error: "Error updating profile. Contact support.",
            };
        }

        // Verify current password
        const isPasswordValid = await verifyPassword(data.current_password, dbUser[0].password_hash);
        if (!isPasswordValid) {
            return {
                status: "ERROR",
                error: "Current password is incorrect",
            };
        }

        // Check if email is being changed and if it's already taken by another user
        if (data.email !== dbUser[0].email) {
            const userWithEmail = await db.select().from(userTable).where(eq(userTable.email, data.email)).limit(1);
            if (userWithEmail.length > 0 && userWithEmail[0].id !== currentUser.id) {
                return {
                    status: "ERROR",
                    error: "Another user with this email already exists",
                };
            }
        }

        // Prepare update data
        const updateData: InferInsertModel<typeof userTable> = {
            name: data.name,
            email: data.email,
            updated_at: new Date(),
        };

        // If new password is provided, hash and update it
        if (data.new_password && data.new_password.length > 0) {
            updateData.password_hash = await hashPassword(data.new_password);
        }

        // Update user
        await db.update(userTable).set(updateData).where(eq(userTable.id, currentUser.id));

        // Get updated user with role
        const updatedUserQuery = await db
            .select()
            .from(userTable)
            .leftJoin(roleTable, eq(userTable.role_id, roleTable.id))
            .where(eq(userTable.id, currentUser.id))
            .limit(1);

        const { User: updatedDbUser, Role: dbRole } = updatedUserQuery[0];

        const updatedUser: User = {
            id: updatedDbUser.id,
            name: updatedDbUser.name,
            email: updatedDbUser.email,
            role: dbRole
                ? {
                    id: dbRole.id,
                    name: dbRole.name,
                    description: dbRole.description || '',
                    key: dbRole.key as RoleKey,
                }
                : null,
            created_at: updatedDbUser.created_at,
            updated_at: updatedDbUser.updated_at,
            is_active: updatedDbUser.is_active,
            last_login_at: updatedDbUser.last_login_at,
            deleted_at: updatedDbUser.deleted_at,
        };

        return {
            status: "SUCCESS",
            data: updatedUser,
        };
    });

export const getCurrentProfile = createServerFn({ method: 'GET' })
    .middleware([isAdminMiddleware])
    .handler(async (ctx): Promise<Result<User>> => {
        const currentUser = ctx.context.user;
        const db = dbClient();

        const userQuery = await db
            .select()
            .from(userTable)
            .leftJoin(roleTable, eq(userTable.role_id, roleTable.id))
            .where(eq(userTable.id, currentUser.id))
            .limit(1);

        if (userQuery.length === 0) {
            return {
                status: "ERROR",
                error: "User not found",
            };
        }

        const { User: dbUser, Role: dbRole } = userQuery[0];

        const user: User = {
            id: dbUser.id,
            name: dbUser.name,
            email: dbUser.email,
            role: dbRole
                ? {
                    id: dbRole.id,
                    name: dbRole.name,
                    description: dbRole.description || '',
                    key: dbRole.key as RoleKey,
                }
                : null,
            created_at: dbUser.created_at,
            updated_at: dbUser.updated_at,
            is_active: dbUser.is_active,
            last_login_at: dbUser.last_login_at,
            deleted_at: dbUser.deleted_at,
        };

        return {
            status: "SUCCESS",
            data: user,
        };
    });
