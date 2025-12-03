import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { eq } from "drizzle-orm";
import {canManageSalesMiddleware} from "@/lib/server/middleware/canManageSales";
import dbClient from "@/lib/db/client";
import { saleTable } from "@/lib/db/schema";

export const updateSaleData = z.object({
    saleId: z.uuid(),
    date: z.date(),
    total_amount: z.number(),
    customer_name: z.string(),
    customer_contact: z.string(),
    restore_sale: z.boolean(),
});

export const updateSale = createServerFn({ method: 'POST' })
    .middleware([canManageSalesMiddleware])
    .inputValidator(updateSaleData)
    .handler(async (ctx) => {
        const { saleId, date, total_amount, customer_name, customer_contact, restore_sale } = ctx.data;

        const db = dbClient();

        const sale = await db.select().from(saleTable).where(eq(saleTable.id, saleId)).get();

        if (!sale) {
            return {
                status: "ERROR",
                error: "Sale not found",
            };
        }

        const updatedFields: Partial<typeof saleTable.$inferSelect> = {
            date,
            total_amount,
            customer_name,
            customer_contact,
            updated_at: new Date(),
            deleted_at: restore_sale ? null : sale.deleted_at,
        };

        await db.update(saleTable)
            .set(updatedFields)
            .where(eq(saleTable.id, saleId));

        const updatedSale = await db.select().from(saleTable).where(eq(saleTable.id, saleId)).get();

        return {
            status: "SUCCESS",
            data: updatedSale,
        };
    });
