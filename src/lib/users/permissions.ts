import { AdminUserRoleKey } from "@/lib/types";

const ADMIN_ROLES_WITH_USER_ACCESS: AdminUserRoleKey[] = ['superadmin', 'admin', 'manager'];

export const canListUsers = (roleKey: string | undefined): boolean => {
    if (!roleKey) return false;
    return ADMIN_ROLES_WITH_USER_ACCESS.includes(roleKey as AdminUserRoleKey);
};