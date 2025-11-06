import { drizzle } from "drizzle-orm/d1";
import { env } from "cloudflare:workers";

const dbClient = () => {
    return drizzle(env.DB);
}

export default dbClient;
