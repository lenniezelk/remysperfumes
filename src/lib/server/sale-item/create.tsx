import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { eq } from "drizzle-orm";
import type { Result } from "@/lib/types";
import { canManageSalesMiddleware } from "@/lib/server/middleware/canManageSales";
import dbClient from "@/lib/db/client";
import { saleTable, saleItemTable, productVariantTable, stockBatchTable } from "@/lib/db/schema";

export const CreateSaleItemInput = z.object({
    sale_id: z.string({ message: 'Sale is required' }),
    product_variant_id: z.string({ message: 'Product variant is required' }),
    stock_batch_id: z.string({ message: 'Stock batch is required' }),
    quantity_sold: z.number().int().positive("Quantity must be positive"),
    price_at_sale: z.number().int().positive("Price must be positive"),
    cost_at_sale: z.number().int().positive("Cost must be positive"),
});

export const createSaleItem = createServerFn({ method: 'POST' })
    .middleware([canManageSalesMiddleware])
    .inputValidator(CreateSaleItemInput)
    .handler(async (ctx): Promise<Result<typeof saleItemTable.$inferSelect>> => {
        const db = dbClient();
        const data = ctx.data;

        // Verify sale exists
        const sale = await db
            .select()
            .from(saleTable)
            .where(eq(saleTable.id, data.sale_id))
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
            .where(eq(productVariantTable.id, data.product_variant_id))
            .get();

        if (!productVariant) {
            return {
                status: "ERROR",
                error: "Product variant not found",
            };
        }

        // Verify stock batch exists and has sufficient quantity
        const stockBatch = await db
            .select()
            .from(stockBatchTable)
            .where(eq(stockBatchTable.id, data.stock_batch_id))
            .get();

        if (!stockBatch) {
            return {
                status: "ERROR",
                error: "Stock batch not found",
            };
        }

        if (stockBatch.quantity_remaining < data.quantity_sold) {
            return {
                status: "ERROR",
                error: `Insufficient stock. Available: ${stockBatch.quantity_remaining}, Requested: ${data.quantity_sold}`,
            };
        }

        // Create the sale item
        const newSaleItem = {
            id: crypto.randomUUID(),
            sale_id: data.sale_id,
            product_variant_id: data.product_variant_id,
            stock_batch_id: data.stock_batch_id,
            quantity_sold: data.quantity_sold,
            price_at_sale: data.price_at_sale,
            cost_at_sale: data.cost_at_sale,
            created_at: new Date(),
            updated_at: new Date(),
        };

        const insertedSaleItem = await db.insert(saleItemTable).values(newSaleItem).returning();

        // Update stock batch quantity
        await db.update(stockBatchTable)
            .set({ 
                quantity_remaining: stockBatch.quantity_remaining - data.quantity_sold,
                updated_at: new Date()
            })
            .where(eq(stockBatchTable.id, data.stock_batch_id));

        return {
            status: "SUCCESS",
            data: insertedSaleItem[0],
        };
    });
