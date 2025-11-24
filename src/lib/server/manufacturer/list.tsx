import { createServerFn } from "@tanstack/react-start";
import { asc } from "drizzle-orm";
import { canManageManufacturersMiddleware } from "../middleware/canManageManufacturers";
import type { Result } from "@/lib/types";
import type { Manufacturer } from "@/lib/types/manufacturer";
import dbClient from "@/lib/db/client";
import { manufacturerTable } from "@/lib/db/schema";

export const listManufacturers = createServerFn({ method: 'GET' })
    .middleware([canManageManufacturersMiddleware])
    .handler(async (): Promise<Result<Array<Manufacturer>>> => {
        const db = dbClient();

        const manufacturers = await db.select().from(manufacturerTable).orderBy(asc(manufacturerTable.name));

        return {
            status: "SUCCESS",
            data: manufacturers,
        };
    });
