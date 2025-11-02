import { useSession } from "@tanstack/react-start/server"
import { AppSession } from "@/lib/types";

export function useAppSession() {
    return useSession<AppSession>({
        password: process.env.SESSION_SECRET || 'default_secret',
    });
}