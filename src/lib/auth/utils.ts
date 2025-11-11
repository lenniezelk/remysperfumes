// Helper functions to convert between formats
const hex = (buff: ArrayBuffer) => [...new Uint8Array(buff)].map(b => b.toString(16).padStart(2, '0')).join('');
const unhex = (str: string) => new Uint8Array(str.match(/.{1,2}/g)!.map(byte => Number.parseInt(byte, 16)));

const PBKDF2_ITERATIONS = 100000; // Standard number of iterations

/**
 * Hashes a password with a random salt using PBKDF2.
 * @param password The password to hash.
 * @returns A string in the format "iterations:salt:hash"
 */
export async function hashPassword(password: string): Promise<string> {
    // 1. Generate a random salt
    const salt = crypto.getRandomValues(new Uint8Array(16));

    // 2. Import the password as a cryptographic key
    const key = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(password),
        { name: 'PBKDF2' },
        false,
        ['deriveBits']
    );

    // 3. Derive the hash using PBKDF2
    const hashBuffer = await crypto.subtle.deriveBits(
        {
            name: 'PBKDF2',
            salt: salt.buffer,
            iterations: PBKDF2_ITERATIONS,
            hash: 'SHA-256',
        },
        key,
        256 // 256 bits (32 bytes)
    );

    // 4. Store iterations, salt, and hash together
    return `${PBKDF2_ITERATIONS}:${hex(salt.buffer)}:${hex(hashBuffer)}`;
}

/**
 * Verifies a password against a stored PBKDF2 hash.
 * @param password The password attempt.
 * @param storedHash The "iterations:salt:hash" string from your database.
 * @returns True if the password is correct.
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
    // 1. Split the stored string to get the original parameters
    const [iterationsStr, saltHex, hashHex] = storedHash.split(':');
    const iterations = Number.parseInt(iterationsStr, 10);
    const saltBuffer = unhex(saltHex);

    // 2. Re-hash the incoming password with the same parameters
    const key = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(password),
        { name: 'PBKDF2' },
        false,
        ['deriveBits']
    );

    const hashBufferAttempt = await crypto.subtle.deriveBits(
        {
            name: 'PBKDF2',
            salt: saltBuffer.buffer,
            iterations: iterations,
            hash: 'SHA-256',
        },
        key,
        256
    );

    // 3. Compare the new hash with the stored hash
    const hashAttemptHex = hex(hashBufferAttempt);
    return hashAttemptHex === hashHex;
}

export function createRandomPassword(length: number = 8): string {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@$!%*?&+-_=.,;:'\"[]{}()";
    let password = "";
    const randomValues = crypto.getRandomValues(new Uint8Array(length));
    for (let i = 0; i < length; i++) {
        password += charset[randomValues[i] % charset.length];
    }
    return password;
}