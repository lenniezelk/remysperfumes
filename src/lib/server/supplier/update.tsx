import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { canManageSuppliersMiddleware } from "../middleware/canManageSuppliers";
import dbClient from "@/lib/db/client";
import { supplierTable } from "@/lib/db/schema";

export const UpdateSupplierData = z.object({
    supplierId: z.uuid(),
    name: z.string().min(1, 'Name is required'),
    contact_info: z.string(),
    restore_supplier: z.boolean(),
});

export const updateSupplier = createServerFn({ method: 'POST' })
    .middleware([canManageSuppliersMiddleware])
    .inputValidator(UpdateSupplierData)
    .handler(async (ctx) => {
        const { supplierId, name, contact_info, restore_supplier } = ctx.data;

        const db = dbClient();

        const supplier = await db.select().from(supplierTable).where(eq(supplierTable.id, supplierId)).get();

        if (!supplier) {
            return {
                status: "ERROR",
                error: "Supplier not found",
            };
        }

        const updatedFields: Partial<typeof supplierTable.$inferSelect> = {
            name,
            contact_info,
            updated_at: new Date(),
            deleted_at: restore_supplier ? null : supplier.deleted_at,
        };

        await db.update(supplierTable)
            .set(updatedFields)
            .where(eq(supplierTable.id, supplierId));

        const updatedSupplier = await db.select().from(supplierTable).where(eq(supplierTable.id, supplierId)).get();

        return {
            status: "SUCCESS",
            data: updatedSupplier,
        };
    });
