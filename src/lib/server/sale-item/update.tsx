import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { canManageSalesMiddleware } from "@/lib/server/middleware/canManageSales";
import dbClient from "@/lib/db/client";
import { saleTable, saleItemTable, productVariantTable, stockBatchTable } from "@/lib/db/schema";

export const UpdateSaleItemData = z.object({
    saleItemId: z.string(),
    sale_id: z.string({ message: 'Sale is required' }),
    product_variant_id: z.string({ message: 'Product variant is required' }),
    stock_batch_id: z.string({ message: 'Stock batch is required' }),
    quantity_sold: z.number().int().positive("Quantity must be positive"),
    price_at_sale: z.number().int().positive("Price must be positive"),
    cost_at_sale: z.number().int().positive("Cost must be positive"),
});

export const updateSaleItem = createServerFn({ method: 'POST' })
    .middleware([canManageSalesMiddleware])
    .inputValidator(UpdateSaleItemData)
    .handler(async (ctx) => {
        const { saleItemId, sale_id, product_variant_id, stock_batch_id, quantity_sold, price_at_sale, cost_at_sale } = ctx.data;

        const db = dbClient();

        // Get existing sale item
        const saleItem = await db.select().from(saleItemTable).where(eq(saleItemTable.id, saleItemId)).get();

        if (!saleItem) {
            return {
                status: "ERROR",
                error: "Sale item not found",
            };
        }

        // Verify sale exists
        const sale = await db
            .select()
            .from(saleTable)
            .where(eq(saleTable.id, sale_id))
            .get();

        if (!sale) {
            return {
                status: "ERROR",
                error: "Sale not found",
            };
        }

        // Verify product variant exists
        const productVariant = await db
            .select()
            .from(productVariantTable)
            .where(eq(productVariantTable.id, product_variant_id))
            .get();

        if (!productVariant) {
            return {
                status: "ERROR",
                error: "Product variant not found",
            };
        }

        // Verify stock batch exists
        const stockBatch = await db
            .select()
            .from(stockBatchTable)
            .where(eq(stockBatchTable.id, stock_batch_id))
            .get();

        if (!stockBatch) {
            return {
                status: "ERROR",
                error: "Stock batch not found",
            };
        }

        // If quantity changed, update stock batch
        if (quantity_sold !== saleItem.quantity_sold || stock_batch_id !== saleItem.stock_batch_id) {
            // Restore quantity to old stock batch if it changed
            if (stock_batch_id !== saleItem.stock_batch_id) {
                const oldStockBatch = await db
                    .select()
                    .from(stockBatchTable)
                    .where(eq(stockBatchTable.id, saleItem.stock_batch_id))
                    .get();

                if (oldStockBatch) {
                    await db.update(stockBatchTable)
                        .set({ 
                            quantity_remaining: oldStockBatch.quantity_remaining + saleItem.quantity_sold,
                            updated_at: new Date()
                        })
                        .where(eq(stockBatchTable.id, saleItem.stock_batch_id));
                }
            } else {
                // Same stock batch, just adjust the difference
                const quantityDiff = quantity_sold - saleItem.quantity_sold;
                if (stockBatch.quantity_remaining < quantityDiff) {
                    return {
                        status: "ERROR",
                        error: `Insufficient stock. Available: ${stockBatch.quantity_remaining}, Additional needed: ${quantityDiff}`,
                    };
                }
            }

            // Update new stock batch
            const newQuantityRemaining = stock_batch_id === saleItem.stock_batch_id 
                ? stockBatch.quantity_remaining - (quantity_sold - saleItem.quantity_sold)
                : stockBatch.quantity_remaining - quantity_sold;

            if (newQuantityRemaining < 0) {
                return {
                    status: "ERROR",
                    error: `Insufficient stock. Available: ${stockBatch.quantity_remaining}, Requested: ${quantity_sold}`,
                };
            }

            await db.update(stockBatchTable)
                .set({ 
                    quantity_remaining: newQuantityRemaining,
                    updated_at: new Date()
                })
                .where(eq(stockBatchTable.id, stock_batch_id));
        }

        // Update sale item
        const updatedFields: Partial<typeof saleItemTable.$inferSelect> = {
            sale_id,
            product_variant_id,
            stock_batch_id,
            quantity_sold,
            price_at_sale,
            cost_at_sale,
            updated_at: new Date(),
        };

        await db.update(saleItemTable)
            .set(updatedFields)
            .where(eq(saleItemTable.id, saleItemId));

        const updatedSaleItem = await db.select().from(saleItemTable).where(eq(saleItemTable.id, saleItemId)).get();

        return {
            status: "SUCCESS",
            data: updatedSaleItem,
        };
    });
