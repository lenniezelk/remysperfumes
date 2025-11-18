import { createServerFn } from "@tanstack/react-start";
import { getCurrentAdminUser } from "@/lib/auth/auth";
import { redirect } from "@tanstack/react-router";
import dbClient from "@/lib/db/client";
import { userTable, roleTable } from "@/lib/db/schema";
import { desc, eq, is } from "drizzle-orm";
import { Role, type Result, type User, type UserUpdateData } from "@/lib/types";
import { canManageUsers, rolesUserCanCreateBasedOnRole, type RoleKey } from "@/lib/permissions";
import { createRandomPassword, hashPassword } from "@/lib/auth/utils";
import { z } from "zod";


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
            deleted_at: User.deleted_at,
        })),
    }
});

export const CreateUserData = z.object({
    name: z.string().min(2, { message: "Name must be at least 2 characters long" }).max(100, { message: "Name must be at most 100 characters long" }),
    email: z.email(),
    role_id: z.uuid({ message: "Invalid role ID" }),
    is_active: z.boolean(),
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

export const FetchUserByIdInput = z.object({
    userId: z.uuid(),
});

export const fetchEditUserInitialData = createServerFn({ method: 'GET' }).inputValidator(FetchUserByIdInput).handler(async (ctx): Promise<Result<{ user: User; roles: Role[] }>> => {
    const userId = ctx.data.userId;
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
        .where(eq(userTable.id, userId))
        .limit(1);

    if (users.length === 0) {
        return {
            status: "ERROR",
            error: "User not found",
        };
    }

    const { User: dbUser, Role: dbRole } = users[0];

    const dbRoles = await db.select().from(roleTable).all();
    const availableRoles = dbRoles.filter(role => rolesUserCanCreateBasedOnRole(signedInUser?.role?.key).includes(role.key as RoleKey));


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
        data: {
            user,
            roles: availableRoles.map(role => ({
                id: role.id,
                name: role.name,
                description: role.description || '',
                key: role.key as RoleKey,
            })),
        },
    };
});

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

export const updateAdminUser = createServerFn({ method: 'POST' }).inputValidator(UpdateUserData).handler(async (ctx): Promise<Result<User>> => {
    const db = dbClient();
    const data = ctx.data;

    const session = await getCurrentAdminUser();

    if (session.status !== "SUCCESS") {
        throw redirect({ to: '/admin-login', replace: true });
    }

    const signedInUser = session.data;

    if (!canManageUsers(signedInUser?.role?.key)) {
        throw redirect({ to: '/not-authorized', replace: true });
    }

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

    if (existingUser[0].id === signedInUser?.id) {
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
