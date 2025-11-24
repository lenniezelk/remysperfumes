import { createMiddleware } from "@tanstack/react-start";
import { redirect } from "@tanstack/react-router";
import { isAdminMiddleware } from "./isAdmin";
import { canManageStockBatches } from "@/lib/permissions";

export const canManageStockBatchesMiddleware = createMiddleware({ type: 'function' })
    .middleware([isAdminMiddleware])
    .server(async ({ next, context }) => {
        const { user } = context;

        if (!canManageStockBatches(user.role?.key)) {
            throw redirect({
                to: '/not-authorized',
                replace: true,
            });
        }

        return next({ context });
    });
