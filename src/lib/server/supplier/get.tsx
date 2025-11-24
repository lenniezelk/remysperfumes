import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { canManageSuppliersMiddleware } from "../middleware/canManageSuppliers";
import dbClient from "@/lib/db/client";
import { supplierTable } from "@/lib/db/schema";

export const GetSupplierInput = z.object({
    supplierId: z.uuid(),
})

export const getSupplierById = createServerFn({ method: 'GET' })
    .middleware([canManageSuppliersMiddleware])
    .inputValidator(GetSupplierInput)
    .handler(async (ctx) => {
        const { supplierId } = ctx.data;

        const db = dbClient();

        const supplier = await db.select().from(supplierTable).where(eq(supplierTable.id, supplierId)).get();

        if (!supplier) {
            return {
                status: "ERROR",
                error: "Supplier not found",
            };
        }

        return {
            status: "SUCCESS",
            data: supplier,
        };
    });
