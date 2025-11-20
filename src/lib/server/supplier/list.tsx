import dbClient from "@/lib/db/client";
import { createServerFn } from "@tanstack/react-start";
import { supplierTable } from "@/lib/db/schema";
import { asc } from "drizzle-orm";
import { Result } from "@/lib/types";
import { Supplier } from "@/lib/types/supplier";
import { canManageSuppliersMiddleware } from "../middleware/canManageSuppliers";

export const listSuppliers = createServerFn({ method: 'GET' })
    .middleware([canManageSuppliersMiddleware])
    .handler(async (): Promise<Result<Supplier[]>> => {
        const db = dbClient();

        const suppliers = await db.select().from(supplierTable).orderBy(asc(supplierTable.name));

        return {
            status: "SUCCESS",
            data: suppliers,
        };
    });
