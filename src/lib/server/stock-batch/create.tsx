import { createServerFn } from "@tanstack/react-start";
import { canManageStockBatchesMiddleware } from "@/lib/server/middleware/canManageStockBatches";
import dbClient from "@/lib/db/client";
import { stockBatchTable, productVariantTable, supplierTable } from "@/lib/db/schema";
import { z } from "zod";
import { StockBatch } from "@/lib/types/stock-batch";
import { Result } from "@/lib/types";
import { eq } from "drizzle-orm";

export const CreateStockBatchInput = z.object({
    product_variant_id: z.string({ message: 'Product variant is required' }),
    supplier: z.string(),
    quantity_received: z.number().int().positive("Quantity received must be positive"),
    buy_price_per_unit: z.number().int().nonnegative("Buy price cannot be negative"),
    sell_price_per_unit: z.number().int().positive("Sell price must be positive"),
    min_sale_price_per_unit: z.number().int().positive("Minimum sale price must be positive"),
    received_at: z.date(),
}).refine((data) => data.min_sale_price_per_unit <= data.sell_price_per_unit, {
    message: "Minimum sale price cannot exceed sell price",
    path: ["min_sale_price_per_unit"],
});

export const createStockBatch = createServerFn({ method: 'POST' })
    .middleware([canManageStockBatchesMiddleware])
    .inputValidator(CreateStockBatchInput)
    .handler(async (ctx): Promise<Result<StockBatch>> => {
        const db = dbClient();

        const data = ctx.data;

        // Verify product variant exists
        const variant = await db
            .select()
            .from(productVariantTable)
            .where(eq(productVariantTable.id, data.product_variant_id))
            .get();

        if (!variant) {
            return {
                status: "ERROR",
                error: "Product variant not found",
            };
        }

        // Verify supplier exists
        if (data.supplier) {
            const supplier = await db
                .select()
                .from(supplierTable)
                .where(eq(supplierTable.id, data.supplier))
                .get();

            if (!supplier) {
                return {
                    status: "ERROR",
                    error: "Supplier not found",
                };
            }

        }

        const newStockBatch: StockBatch = {
            id: crypto.randomUUID(),
            product_variant_id: data.product_variant_id,
            supplier: data.supplier || null,
            quantity_received: data.quantity_received,
            quantity_remaining: data.quantity_received,
            buy_price_per_unit: data.buy_price_per_unit,
            sell_price_per_unit: data.sell_price_per_unit,
            min_sale_price_per_unit: data.min_sale_price_per_unit,
            received_at: data.received_at,
            created_at: new Date(),
            updated_at: new Date(),
            deleted_at: null,
        };

        await db.insert(stockBatchTable).values(newStockBatch);

        return {
            status: "SUCCESS",
            data: newStockBatch,
        }
    });
