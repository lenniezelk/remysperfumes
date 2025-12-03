import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { Sale } from "@/lib/types/sales";
import type { Result } from "@/lib/types";
import { canManageSalesMiddleware } from "@/lib/server/middleware/canManageSales";
import dbClient from "@/lib/db/client";
import { saleTable } from "@/lib/db/schema";

export const CreateSaleInput = z.object({
    date: z.date(),
    total_amount: z.number(),
    customer_name: z.string(),
    customer_contact: z.string(),
});

export const createSale = createServerFn({ method: 'POST' })
    .middleware([canManageSalesMiddleware])
    .inputValidator(CreateSaleInput)
    .handler(async (ctx): Promise<Result<Sale>> => {
        const db = dbClient();

        const data = ctx.data;

        const newSale: Sale = {
            id: crypto.randomUUID(),
            date: data.date,
            total_amount: data.total_amount,
            customer_name: data.customer_name,
            customer_contact: data.customer_contact,
            created_at: new Date(),
            updated_at: new Date(),
            deleted_at: null,
        };

        await db.insert(saleTable).values(newSale);

        return {
            status: "SUCCESS",
            data: newSale,
        }
    });
