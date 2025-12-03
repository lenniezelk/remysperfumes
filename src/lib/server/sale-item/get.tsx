import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { canManageSalesMiddleware } from "@/lib/server/middleware/canManageSales";
import type { Result } from "@/lib/types";
import dbClient from "@/lib/db/client";
import { saleItemTable } from "@/lib/db/schema";

const GetSaleItemInput = z.object({
    saleItemId: z.string(),
});

export const getSaleItemById = createServerFn({ method: 'GET' })
    .middleware([canManageSalesMiddleware])
    .inputValidator(GetSaleItemInput)
    .handler(async (ctx): Promise<Result<typeof saleItemTable.$inferSelect>> => {
        const db = dbClient();

        const saleItem = await db
            .select()
            .from(saleItemTable)
            .where(eq(saleItemTable.id, ctx.data.saleItemId))
            .get();

        if (!saleItem) {
            return {
                status: "ERROR",
                error: "Sale item not found",
            };
        }

        return {
            status: "SUCCESS",
            data: saleItem,
        };
    });
