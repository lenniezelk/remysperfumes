import { useSession } from "@tanstack/react-start/server"
import { AdminAppSession } from "@/lib/types";

export function useAdminAppSession() {
    return useSession<AdminAppSession>({
        name: 'adminAppSession',
        password: process.env.SESSION_SECRET || 'default_secret',
    });
}