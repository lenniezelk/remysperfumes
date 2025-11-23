import dbClient from "@/lib/db/client";
import { createServerFn } from "@tanstack/react-start";
import { stockBatchTable } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Result } from "@/lib/types";
import { StockBatch } from "@/lib/types/stock-batch";
import { canManageStockBatchesMiddleware } from "../middleware/canManageStockBatches";
import { z } from "zod";

const GetStockBatchInput = z.object({
    stockBatchId: z.string(),
});

export const getStockBatchById = createServerFn({ method: 'GET' })
    .middleware([canManageStockBatchesMiddleware])
    .inputValidator(GetStockBatchInput)
    .handler(async (ctx): Promise<Result<StockBatch>> => {
        const db = dbClient();

        const stockBatch = await db
            .select()
            .from(stockBatchTable)
            .where(eq(stockBatchTable.id, ctx.data.stockBatchId))
            .get();

        if (!stockBatch) {
            return {
                status: "ERROR",
                error: "Stock batch not found",
            };
        }

        return {
            status: "SUCCESS",
            data: stockBatch,
        };
    });
