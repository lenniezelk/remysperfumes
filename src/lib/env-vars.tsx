import { createServerFn } from "@tanstack/react-start";
import type { EnvVars, Result } from "@/lib/types";
import { env } from "cloudflare:workers";

export const getEnvVars = createServerFn({ method: 'GET' }).handler(async (): Promise<Result<EnvVars>> => {
    return {
        status: "SUCCESS",
        data: {
            GOOGLE_OAUTH_CLIENT_ID: env.GOOGLE_OAUTH_CLIENT_ID || '',
        },
    };
});