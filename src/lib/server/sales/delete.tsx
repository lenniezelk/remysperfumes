import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { eq } from "drizzle-orm";
import {canManageSalesMiddleware} from "@/lib/server/middleware/canManageSales";
import dbClient from "@/lib/db/client";
import { saleTable } from "@/lib/db/schema";

export const DeleteSaleInput = z.object({
    saleId: z.string(),
});

export const deleteSale = createServerFn({ method: 'POST' })
    .middleware([canManageSalesMiddleware])
    .inputValidator(DeleteSaleInput)
    .handler(async (ctx) => {
        const { saleId } = ctx.data;

        const db = dbClient();

        // check if sale exists
        const sale = await db.select().from(saleTable).where(eq(saleTable.id, saleId)).get();
        if (!sale) {
            return {
                status: "ERROR",
                error: "Sale not found",
            };
        }

        // Soft delete: set deleted_at to current timestamp
        await db.update(saleTable)
            .set({ deleted_at: new Date() })
            .where(eq(saleTable.id, saleId));

        return {
            status: "SUCCESS",
            data: null,
        };
    });
