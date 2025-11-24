import 'dotenv/config';
import { execSync } from 'node:child_process';
import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { z } from 'zod';
import { hashPassword } from '@/lib/auth/utils';

interface DBRole {
    id: string;
    name: string;
    description: string;
    key: string;
    created_at: number;
    updated_at: number;
}

interface DBUser {
    id: string;
    name: string;
    email: string;
    password_hash: string;
    is_active: boolean;
    created_at: number;
    updated_at: number;
    role_id: string;
}

const CreateUserData = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters long').max(100, 'Name must be at most 100 characters long'),
    email: z.email(),
    password: z.string().min(8).regex(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&+\-_=.,;:'"\[\]{}()])[\w@$!%*?&+\-_=.,;:'"\[\]{}()]+$/, 'Password must be at least 8 characters long and contain at least one letter, one number, and one special character'),
});

function main() {
    if (process.argv.includes('--add-roles')) {
        addRoles();
    } else if (process.argv.includes('--add-superadmin')) {
        addSuperAdminUser();
    } else {
        console.log('No valid arguments provided. Use --add-roles or --add-superadmin');
    }
}

async function addSuperAdminUser() {
    console.log('Adding a new user...');
    const rl = readline.createInterface({ input, output });

    try {
        const name = await rl.question('Enter your name: ');
        const email = await rl.question('Enter your email: ');
        const password = await rl.question('Enter your password(min 8, include 1 letter, 1 number, 1 special char): ');
        rl.close();

        const parsedData = CreateUserData.safeParse({ name, email, password });
        if (!parsedData.success) {
            console.error('Invalid user data:', parsedData.error.format());
            process.exit(1);
        }

        // check for super admin role in db
        const roleCheckCommand = `wrangler d1 execute DB --json --local --command "SELECT * FROM Role WHERE key = 'superadmin';"`;
        const roleCheckOutput = execSync(roleCheckCommand, { encoding: 'utf-8' });
        const roleCheckResults = JSON.parse(roleCheckOutput);
        if (roleCheckResults.length === 0 || roleCheckResults[0].results.length === 0) {
            console.error('Super Admin role does not exist in the database.');
            process.exit(1);
        }

        // Check if user with email already exists
        const userCheckCommand = `wrangler d1 execute DB --json --local --command "SELECT * FROM User WHERE email = '${email}';"`;
        const userCheckOutput = execSync(userCheckCommand, { encoding: 'utf-8' });
        const userCheckResults = JSON.parse(userCheckOutput);
        if (userCheckResults.length > 0 && userCheckResults[0].results.length > 0) {
            console.error('A user with that email already exists.');
            process.exit(1);
        }

        const passwordHash = await hashPassword(password);

        const user: DBUser = {
            id: crypto.randomUUID(),
            name: name,
            email: email,
            password_hash: passwordHash,
            role_id: roleCheckResults[0].results[0].id,
            is_active: true,
            created_at: Date.now(),
            updated_at: Date.now(),
        };

        const insertCommand = `wrangler d1 execute DB --json --local --command "INSERT INTO User (id, name, email, password_hash, role_id, is_active, created_at, updated_at) VALUES ('${user.id}', '${user.name}', '${user.email}', '${user.password_hash}', '${user.role_id}', ${user.is_active}, ${user.created_at}, ${user.updated_at});"`;

        let insertOutput: string;
        try {
            insertOutput = execSync(insertCommand, { encoding: 'utf-8' });
        } catch (execError: any) {
            // execSync throws an error on non-zero exit code, but the output might still contain useful JSON
            insertOutput = execError.stdout || execError.stderr || '';
            if (insertOutput) {
                try {
                    const errorResults = JSON.parse(insertOutput);
                    if (errorResults.error) {
                        console.error('Database error:', errorResults.error.text || errorResults.error);
                        process.exit(1);
                    }
                } catch {
                    // If we can't parse JSON, just show the raw output
                    console.error('Command failed with output:', insertOutput);
                }
            }
            throw execError;
        }

        const insertResults = JSON.parse(insertOutput);

        // Check if the response contains an error
        if (insertResults.error) {
            console.error('Database error:', insertResults.error.text || insertResults.error);
            process.exit(1);
        }

        if (insertResults.length > 0 && insertResults[0].success === true) {
            console.log('Super Admin user added successfully with details:');
            console.log(`Name: ${user.name}`);
            console.log(`Email: ${user.email}`);
            process.exit(0);
        } else {
            console.error('Failed to insert user. Response:', insertResults);
            process.exit(1);
        }
    } catch (error: any) {
        rl.close();
        console.error('Error adding super admin:', error.message || String(error));
        process.exit(1);
    }
}

function addRoles() {
    console.log('Seeding DB with roles admin, manager and staff');
    // Implementation for adding roles goes here

    // check if roles exist before adding
    const selectCommand = 'wrangler d1 execute DB --json --local --command "SELECT * FROM Role;"';

    try {
        const selectOutput = execSync(selectCommand, { encoding: 'utf-8' });
        const selectResults = JSON.parse(selectOutput);
        console.log('Existing roles:', selectResults);
        if (selectResults.length > 0 && selectResults[0].results.length > 0) {
            console.log('Roles already exist in the database. Skipping seeding.');
            return;
        }

        const roles: Array<DBRole> = [
            { id: crypto.randomUUID(), name: 'Admin', description: 'Administrator with limited access', key: 'admin', created_at: Date.now(), updated_at: Date.now() },
            { id: crypto.randomUUID(), name: 'Manager', description: 'Manager with limited access', key: 'manager', created_at: Date.now(), updated_at: Date.now() },
            { id: crypto.randomUUID(), name: 'Staff', description: 'Staff member with basic access', key: 'staff', created_at: Date.now(), updated_at: Date.now() },
            { id: crypto.randomUUID(), name: 'Super Admin', description: 'Administrator with full access', key: 'superadmin', created_at: Date.now(), updated_at: Date.now() },
        ];

        const values = roles.map(role => `('${role.id}', '${role.name}', '${role.description.replace(/'/g, "''")}', '${role.key}', ${role.created_at}, ${role.updated_at})`).join(', ');
        const sqlQuery = `INSERT INTO Role (id, name, description, key, created_at, updated_at) VALUES ${values};`;
        const insertCommand = `wrangler d1 execute DB --json --local --command "${sqlQuery.replace(/"/g, '\\"')}"`;
        const insertOutput = execSync(insertCommand, { encoding: 'utf-8' });
        const insertResults = JSON.parse(insertOutput);
        console.log('Inserted roles:', insertResults);

    } catch (error) {
        console.error('Error checking roles:', error instanceof Error ? error.message : String(error));
        process.exit(1);
    }

    // const existingRoles = JSON.parse(stdout);
    // const rolesToAdd = ['admin', 'manager', 'staff'].filter(role => !existingRoles.includes(role));

    // for (const role of rolesToAdd) {
    //     const insertCommand = `wrangler d1 execute DB --local --command "INSERT INTO Role (name) VALUES ('${role}');"`;
    //     await execPromisified(insertCommand);
    // }
}

main();