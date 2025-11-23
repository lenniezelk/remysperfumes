import { createServerFn } from "@tanstack/react-start";
import { canManageStockBatchesMiddleware } from "@/lib/server/middleware/canManageStockBatches";
import { z } from "zod";
import dbClient from "@/lib/db/client";
import { stockBatchTable } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const DeleteStockBatchInput = z.object({
    stockBatchId: z.string(),
})

export const deleteStockBatch = createServerFn({ method: 'POST' })
    .middleware([canManageStockBatchesMiddleware])
    .inputValidator(DeleteStockBatchInput)
    .handler(async (ctx) => {
        const { stockBatchId } = ctx.data;

        const db = dbClient();

        // check if stock batch exists
        const stockBatch = await db.select().from(stockBatchTable).where(eq(stockBatchTable.id, stockBatchId)).get();
        if (!stockBatch) {
            return {
                status: "ERROR",
                error: "Stock batch not found",
            };
        }

        // Soft delete: set deleted_at to current timestamp
        await db.update(stockBatchTable)
            .set({ deleted_at: new Date() })
            .where(eq(stockBatchTable.id, stockBatchId));

        return {
            status: "SUCCESS",
            data: null,
        };
    });
