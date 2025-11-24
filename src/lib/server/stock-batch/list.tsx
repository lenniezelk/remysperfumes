import { createServerFn } from "@tanstack/react-start";
import { desc } from "drizzle-orm";
import { canManageStockBatchesMiddleware } from "../middleware/canManageStockBatches";
import type { Result } from "@/lib/types";
import type { StockBatch } from "@/lib/types/stock-batch";
import dbClient from "@/lib/db/client";
import { stockBatchTable } from "@/lib/db/schema";

export const listStockBatches = createServerFn({ method: 'GET' })
    .middleware([canManageStockBatchesMiddleware])
    .handler(async (): Promise<Result<Array<StockBatch>>> => {
        const db = dbClient();

        const stockBatches = await db.select().from(stockBatchTable).orderBy(desc(stockBatchTable.received_at));

        return {
            status: "SUCCESS",
            data: stockBatches,
        };
    });
