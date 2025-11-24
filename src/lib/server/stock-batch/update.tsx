import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { canManageStockBatchesMiddleware } from "../middleware/canManageStockBatches";
import dbClient from "@/lib/db/client";
import { productVariantTable, stockBatchTable, supplierTable } from "@/lib/db/schema";

export const UpdateStockBatchData = z.object({
    stockBatchId: z.string(),
    product_variant_id: z.string().min(1, "Product variant is required"),
    supplier: z.string(),
    quantity_received: z.number().int().positive("Quantity received must be positive"),
    buy_price_per_unit: z.number().int().nonnegative("Buy price cannot be negative"),
    sell_price_per_unit: z.number().int().positive("Sell price must be positive"),
    min_sale_price_per_unit: z.number().int().positive("Minimum sale price must be positive"),
    received_at: z.date(),
    restore_stock_batch: z.boolean(),
}).refine((data) => data.min_sale_price_per_unit <= data.sell_price_per_unit, {
    message: "Minimum sale price cannot exceed sell price",
    path: ["min_sale_price_per_unit"],
});

export const updateStockBatch = createServerFn({ method: 'POST' })
    .middleware([canManageStockBatchesMiddleware])
    .inputValidator(UpdateStockBatchData)
    .handler(async (ctx) => {
        const { stockBatchId, product_variant_id, supplier, quantity_received, buy_price_per_unit, sell_price_per_unit, min_sale_price_per_unit, received_at, restore_stock_batch } = ctx.data;

        const db = dbClient();

        const stockBatch = await db.select().from(stockBatchTable).where(eq(stockBatchTable.id, stockBatchId)).get();

        if (!stockBatch) {
            return {
                status: "ERROR",
                error: "Stock batch not found",
            };
        }

        // Verify product variant exists
        const variant = await db
            .select()
            .from(productVariantTable)
            .where(eq(productVariantTable.id, product_variant_id))
            .get();

        if (!variant) {
            return {
                status: "ERROR",
                error: "Product variant not found",
            };
        }

        // check if suplier exists
        if (supplier) {
            const supplierExists = await db
                .select()
                .from(supplierTable)
                .where(eq(supplierTable.id, supplier))
                .get();

            if (!supplierExists) {
                return {
                    status: "ERROR",
                    error: "Supplier not found",
                };
            }
        }

        const updatedFields: Partial<typeof stockBatchTable.$inferSelect> = {
            product_variant_id,
            supplier: supplier || null,
            quantity_received,
            quantity_remaining: quantity_received,
            buy_price_per_unit,
            sell_price_per_unit,
            min_sale_price_per_unit,
            received_at,
            updated_at: new Date(),
            deleted_at: restore_stock_batch ? null : stockBatch.deleted_at,
        };

        await db.update(stockBatchTable)
            .set(updatedFields)
            .where(eq(stockBatchTable.id, stockBatchId));

        const updatedStockBatch = await db.select().from(stockBatchTable).where(eq(stockBatchTable.id, stockBatchId)).get();

        return {
            status: "SUCCESS",
            data: updatedStockBatch,
        };
    });
