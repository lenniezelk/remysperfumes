import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { canManageSalesMiddleware } from "@/lib/server/middleware/canManageSales";
import dbClient from "@/lib/db/client";
import { saleItemTable, stockBatchTable } from "@/lib/db/schema";

export const DeleteSaleItemInput = z.object({
    saleItemId: z.string(),
});

export const deleteSaleItem = createServerFn({ method: 'POST' })
    .middleware([canManageSalesMiddleware])
    .inputValidator(DeleteSaleItemInput)
    .handler(async (ctx) => {
        const { saleItemId } = ctx.data;

        const db = dbClient();

        // Check if sale item exists
        const saleItem = await db.select().from(saleItemTable).where(eq(saleItemTable.id, saleItemId)).get();
        if (!saleItem) {
            return {
                status: "ERROR",
                error: "Sale item not found",
            };
        }

        // Restore quantity to stock batch before deleting
        const stockBatch = await db
            .select()
            .from(stockBatchTable)
            .where(eq(stockBatchTable.id, saleItem.stock_batch_id))
            .get();

        if (stockBatch) {
            await db.update(stockBatchTable)
                .set({ 
                    quantity_remaining: stockBatch.quantity_remaining + saleItem.quantity_sold,
                    updated_at: new Date()
                })
                .where(eq(stockBatchTable.id, saleItem.stock_batch_id));
        }

        // Soft delete: set deleted_at to current timestamp
        await db.update(saleItemTable)
            .set({ deleted_at: new Date() })
            .where(eq(saleItemTable.id, saleItemId));

        return {
            status: "SUCCESS",
            data: null,
        };
    });
