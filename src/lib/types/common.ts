export type Result<T> = {
    status: "SUCCESS",
    data: T;
} | {
    status: "ERROR",
    error: string;
}

export type NotificationType = 'INFO' | 'SUCCESS' | 'ERROR' | 'WARNING';

export type PaginatedListResponse<T> = {
    items: T[];
    total: number;
    page: number;
    limit: number;
    offset: number;
}

export interface EnvVars {
    GOOGLE_OAUTH_CLIENT_ID: string;
    CLOUDFLARE_TURNSTILE_SITEKEY: string;
}
