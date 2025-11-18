export type Result<T> = {
    status: "SUCCESS",
    data: T;
} | {
    status: "ERROR",
    error: string;
}

export type NotificationType = 'INFO' | 'SUCCESS' | 'ERROR' | 'WARNING';

export interface EnvVars {
    GOOGLE_OAUTH_CLIENT_ID: string;
    CLOUDFLARE_TURNSTILE_SECRET: string;
}
