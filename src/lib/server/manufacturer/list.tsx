import dbClient from "@/lib/db/client";
import { createServerFn } from "@tanstack/react-start";
import { manufacturerTable } from "@/lib/db/schema";
import { asc } from "drizzle-orm";
import { Result } from "@/lib/types";
import { Manufacturer } from "@/lib/types/manufacturer";
import { canManageManufacturersMiddleware } from "../middleware/canManageManufacturers";

export const listManufacturers = createServerFn({ method: 'GET' })
    .middleware([canManageManufacturersMiddleware])
    .handler(async (): Promise<Result<Manufacturer[]>> => {
        const db = dbClient();

        const manufacturers = await db.select().from(manufacturerTable).orderBy(asc(manufacturerTable.name));

        return {
            status: "SUCCESS",
            data: manufacturers,
        };
    });
