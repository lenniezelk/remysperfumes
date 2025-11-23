import dbClient from "@/lib/db/client";
import { createServerFn } from "@tanstack/react-start";
import { stockBatchTable } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { Result } from "@/lib/types";
import { StockBatch } from "@/lib/types/stock-batch";
import { canManageStockBatchesMiddleware } from "../middleware/canManageStockBatches";

export const listStockBatches = createServerFn({ method: 'GET' })
    .middleware([canManageStockBatchesMiddleware])
    .handler(async (): Promise<Result<StockBatch[]>> => {
        const db = dbClient();

        const stockBatches = await db.select().from(stockBatchTable).orderBy(desc(stockBatchTable.received_at));

        return {
            status: "SUCCESS",
            data: stockBatches,
        };
    });
