import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { eq } from "drizzle-orm";
import {canManageSalesMiddleware} from "@/lib/server/middleware/canManageSales";
import dbClient from "@/lib/db/client";
import { saleTable } from "@/lib/db/schema";

export const GetSaleInput = z.object({
    saleId: z.string(),
});

export const getSale = createServerFn({ method: 'GET' })
    .middleware([canManageSalesMiddleware])
    .inputValidator(GetSaleInput)
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

        return {
            status: "SUCCESS",
            data: sale,
        };
    });