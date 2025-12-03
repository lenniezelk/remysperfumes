import { createServerFn } from "@tanstack/react-start";
import { eq, isNull, and } from "drizzle-orm";
import { z } from "zod";
import { canManageSalesMiddleware } from "@/lib/server/middleware/canManageSales";
import type { Result } from "@/lib/types";
import dbClient from "@/lib/db/client";
import { saleItemTable } from "@/lib/db/schema";

const ListSaleItemsBySaleInput = z.object({
    sale_id: z.string(),
});

export const listSaleItemsBySale = createServerFn({ method: 'GET' })
    .middleware([canManageSalesMiddleware])
    .inputValidator(ListSaleItemsBySaleInput)
    .handler(async (ctx): Promise<Result<Array<typeof saleItemTable.$inferSelect>>> => {
        const db = dbClient();

        const saleItems = await db
            .select()
            .from(saleItemTable)
            .where(and(
                eq(saleItemTable.sale_id, ctx.data.sale_id),
                isNull(saleItemTable.deleted_at)
            ))
            .orderBy(saleItemTable.created_at);

        return {
            status: "SUCCESS",
            data: saleItems,
        };
    });
