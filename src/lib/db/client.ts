import { drizzle } from "drizzle-orm/d1";
import { getBindings } from "@/lib/cf_bindings";


const dbClient = () => {
    return drizzle(getBindings().DB);
}

export default dbClient;
