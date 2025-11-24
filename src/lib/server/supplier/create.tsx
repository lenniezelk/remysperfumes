import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { Supplier } from "@/lib/types/supplier";
import type { Result } from "@/lib/types";
import { canManageSuppliersMiddleware } from "@/lib/server/middleware/canManageSuppliers";
import dbClient from "@/lib/db/client";
import { supplierTable } from "@/lib/db/schema";

export const CreateSupplierInput = z.object({
    name: z.string().min(1, "Name is required"),
    contact_info: z.string(),
});

export const createSupplier = createServerFn({ method: 'POST' })
    .middleware([canManageSuppliersMiddleware])
    .inputValidator(CreateSupplierInput)
    .handler(async (ctx): Promise<Result<Supplier>> => {
        const db = dbClient();

        const data = ctx.data;

        const newSupplier: Supplier = {
            id: crypto.randomUUID(),
            name: data.name,
            contact_info: data.contact_info,
            created_at: new Date(),
            updated_at: new Date(),
            deleted_at: null,
        };

        await db.insert(supplierTable).values(newSupplier);

        return {
            status: "SUCCESS",
            data: newSupplier,
        }
    });
