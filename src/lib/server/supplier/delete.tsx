import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { z } from "zod";
import type { Result } from "@/lib/types";
import dbClient from "@/lib/db/client";
import { supplierTable } from "@/lib/db/schema";
import { canManageSuppliersMiddleware } from "../middleware/canManageSuppliers";

export const DeleteSupplierInput = z.object({
    supplierId: z.uuid(),
});

export const deleteSupplier = createServerFn({ method: 'POST' })
    .middleware([canManageSuppliersMiddleware])
    .inputValidator(DeleteSupplierInput)
    .handler(async (ctx): Promise<Result<null>> => {
        const db = dbClient();
        const { supplierId } = ctx.data;

        const existingSupplier = await db.select().from(supplierTable).where(eq(supplierTable.id, supplierId)).limit(1);
        if (existingSupplier.length === 0) {
            return {
                status: "ERROR",
                error: "Supplier not found",
            };
        }

        // Soft delete: set deleted_at to current timestamp
        await db.update(supplierTable)
            .set({
                deleted_at: new Date(),
                updated_at: new Date(),
            })
            .where(eq(supplierTable.id, supplierId));

        return {
            status: "SUCCESS",
            data: null,
        };
    });

export const RestoreSupplierInput = z.object({
    supplierId: z.uuid(),
});

export const restoreSupplier = createServerFn({ method: 'POST' })
    .middleware([canManageSuppliersMiddleware])
    .inputValidator(RestoreSupplierInput)
    .handler(async (ctx): Promise<Result<null>> => {
        const db = dbClient();
        const { supplierId } = ctx.data;

        const existingSupplier = await db.select().from(supplierTable).where(eq(supplierTable.id, supplierId)).limit(1);
        if (existingSupplier.length === 0) {
            return {
                status: "ERROR",
                error: "Supplier not found",
            };
        }

        // Restore supplier: set deleted_at to null
        await db.update(supplierTable)
            .set({
                deleted_at: null,
                updated_at: new Date(),
            })
            .where(eq(supplierTable.id, supplierId));

        return {
            status: "SUCCESS",
            data: null,
        };
    });
