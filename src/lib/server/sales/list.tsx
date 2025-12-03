import { createServerFn } from "@tanstack/react-start";
import { asc } from "drizzle-orm";
import type { Result } from "@/lib/types";
import {canManageSalesMiddleware} from "@/lib/server/middleware/canManageSales";
import dbClient from "@/lib/db/client";
import { saleTable } from "@/lib/db/schema";
import {Sale} from "@/lib/types/sales";

export const listSales = createServerFn({ method: 'GET' })
    .middleware([canManageSalesMiddleware])
    .handler(async (): Promise<Result<Array<Sale>>> => {
        const db = dbClient();

        const sales = await db.select().from(saleTable).orderBy(asc(saleTable.date));

        return {
            status: "SUCCESS",
            data: sales,
        };
    });
