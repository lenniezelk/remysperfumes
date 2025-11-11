import 'dotenv/config';
import dbClient from './client';
import { reset, seed } from 'drizzle-seed';

function main() {
    console.log('Seeding database...');

    const isReset = process.argv.includes('--reset');

    const db = dbClient();

    if (isReset) {
        console.log('Resetting database...');
    }
}

main();