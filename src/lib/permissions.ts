export const roles = {
    SUPERADMIN: 'superadmin',
    ADMIN: 'admin',
    MANAGER: 'manager',
    STAFF: 'staff',
} as const;

export type RoleKey = typeof roles[keyof typeof roles];

export function hasPermission(userRole: RoleKey | undefined, requiredRole: RoleKey): boolean {
    if (!userRole) return false;
    const roleHierarchy: RoleKey[] = [
        roles.STAFF,
        roles.MANAGER,
        roles.ADMIN,
        roles.SUPERADMIN,
    ];
    const userRoleIndex = roleHierarchy.indexOf(userRole);
    const requiredRoleIndex = roleHierarchy.indexOf(requiredRole);
    return userRoleIndex >= requiredRoleIndex;
}

export const canManageUsers = (roleKey: string | undefined): boolean => {
    return hasPermission(roleKey as RoleKey | undefined, roles.MANAGER);
};


export const rolesUserCanCreateBasedOnRole = (roleKey: RoleKey | undefined): RoleKey[] => {
    switch (roleKey) {
        case roles.SUPERADMIN:
            return [roles.SUPERADMIN, roles.ADMIN, roles.MANAGER, roles.STAFF];
        case roles.ADMIN:
            return [roles.MANAGER, roles.STAFF];
        case roles.MANAGER:
            return [roles.STAFF];
        default:
            return [];
    }
};

export const canEditOrDeleteUser = (currentUserRole: RoleKey | undefined, targetUserRole: RoleKey | undefined): boolean => {
    const creatableRoles = rolesUserCanCreateBasedOnRole(currentUserRole);
    return targetUserRole ? creatableRoles.includes(targetUserRole) : false;
};

export const canManageManufacturers = (roleKey: string | undefined): boolean => {
    return hasPermission(roleKey as RoleKey | undefined, roles.MANAGER);
};