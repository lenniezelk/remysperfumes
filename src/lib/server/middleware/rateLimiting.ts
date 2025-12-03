import { createMiddleware } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";

// In-memory store for rate limiting (consider using Redis or KV for production)
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

// Configuration
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

// Clean up expired entries periodically to prevent memory leaks
setInterval(() => {
    const now = Date.now();
    for (const [ip, data] of loginAttempts.entries()) {
        if (data.resetAt <= now) {
            loginAttempts.delete(ip);
        }
    }
}, 60 * 1000); // Clean up every minute

// Helper to extract IP from headers object
function getClientIP(headers: Headers): string {
    console.log('headers: ', headers);
    const forwarded = headers.get('x-forwarded-for');
    return forwarded
        ? forwarded.split(',')[0].trim()
        : headers.get('x-real-ip') || 'unknown';
}

// Helper function to reset attempts on successful login
export const resetRateLimit = (ip: string) => {
    loginAttempts.delete(ip);
};

export const rateLimitLoginMiddleware = createMiddleware({ type: 'function' }).server(async ({ next }) => {
    const headers = getRequestHeaders();
    const ip = getClientIP(headers);
    console.log('ipaddress: ', ip);
    const now = Date.now();
    const attempts = loginAttempts.get(ip);

    // Check if rate limit exceeded
    if (attempts && attempts.resetAt > now) {
        if (attempts.count >= MAX_ATTEMPTS) {
            const remainingTime = Math.ceil((attempts.resetAt - now) / 1000 / 60);
            throw new Error(`Too many login attempts. Please try again in ${remainingTime} minute(s).`);
        }
        attempts.count++;
    } else {
        // Reset or create new entry
        loginAttempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    }

    // Pass IP through context for successful login reset
    return next({ context: { rateLimitIp: ip } });
});
