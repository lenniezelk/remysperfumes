import { createServerFn } from "@tanstack/react-start";
import { env } from "cloudflare:workers";
import type { EnvVars, Result } from "@/lib/types";

export const getEnvVars = createServerFn({ method: 'GET' }).handler(async (): Promise<Result<EnvVars>> => {
    return {
        status: "SUCCESS",
        data: {
            GOOGLE_OAUTH_CLIENT_ID: env.GOOGLE_OAUTH_CLIENT_ID || '',
            CLOUDFLARE_TURNSTILE_SECRET: env.CLOUDFLARE_TURNSTILE_SECRET || '',
        },
    };
});