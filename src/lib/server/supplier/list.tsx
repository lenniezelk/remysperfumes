import { createServerFn } from "@tanstack/react-start";
import { asc } from "drizzle-orm";
import { canManageSuppliersMiddleware } from "../middleware/canManageSuppliers";
import type { Result } from "@/lib/types";
import type { Supplier } from "@/lib/types/supplier";
import dbClient from "@/lib/db/client";
import { supplierTable } from "@/lib/db/schema";

export const listSuppliers = createServerFn({ method: 'GET' })
    .middleware([canManageSuppliersMiddleware])
    .handler(async (): Promise<Result<Array<Supplier>>> => {
        const db = dbClient();

        const suppliers = await db.select().from(supplierTable).orderBy(asc(supplierTable.name));

        return {
            status: "SUCCESS",
            data: suppliers,
        };
    });
