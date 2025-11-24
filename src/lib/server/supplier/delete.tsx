import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { canManageSuppliersMiddleware } from "@/lib/server/middleware/canManageSuppliers";
import dbClient from "@/lib/db/client";
import { supplierTable } from "@/lib/db/schema";

export const DeleteSupplierInput = z.object({
    supplierId: z.uuid(),
})

export const deleteSupplier = createServerFn({ method: 'POST' })
    .middleware([canManageSuppliersMiddleware])
    .inputValidator(DeleteSupplierInput)
    .handler(async (ctx) => {
        const { supplierId } = ctx.data;

        const db = dbClient();

        // check if supplier exists
        const supplier = await db.select().from(supplierTable).where(eq(supplierTable.id, supplierId)).get();
        if (!supplier) {
            return {
                status: "ERROR",
                error: "Supplier not found",
            };
        }

        // Soft delete: set deleted_at to current timestamp
        await db.update(supplierTable)
            .set({ deleted_at: new Date() })
            .where(eq(supplierTable.id, supplierId));

        return {
            status: "SUCCESS",
            data: null,
        };
    });
