import { createServerFn } from "@tanstack/react-start";
import { desc, isNull } from "drizzle-orm";
import { canManageSalesMiddleware } from "@/lib/server/middleware/canManageSales";
import type { Result } from "@/lib/types";
import dbClient from "@/lib/db/client";
import { saleItemTable } from "@/lib/db/schema";

export const listSaleItems = createServerFn({ method: 'GET' })
    .middleware([canManageSalesMiddleware])
    .handler(async (): Promise<Result<Array<typeof saleItemTable.$inferSelect>>> => {
        const db = dbClient();

        const saleItems = await db
            .select()
            .from(saleItemTable)
            .where(isNull(saleItemTable.deleted_at))
            .orderBy(desc(saleItemTable.created_at));

        return {
            status: "SUCCESS",
            data: saleItems,
        };
    });
