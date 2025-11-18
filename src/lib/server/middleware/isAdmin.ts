import { getCurrentAdminUser } from "@/lib/auth/auth";
import { createMiddleware } from "@tanstack/react-start";
import { redirect } from "@tanstack/react-router";

export const isAdminMiddleware = createMiddleware({ type: 'function' }).server(async ({ next }) => {
    const signedInUser = await getCurrentAdminUser();

    if (signedInUser.status !== "SUCCESS") {
        throw redirect({
            to: '/admin-login',
            replace: true,
        });
    }

    return next({ context: { user: signedInUser.data } });
});