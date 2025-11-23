import dbClient from "@/lib/db/client";
import { createServerFn } from "@tanstack/react-start";
import { productVariantTable, productTable } from "@/lib/db/schema";
import { asc, eq } from "drizzle-orm";
import { canManageStockBatchesMiddleware } from "../middleware/canManageStockBatches";

export const listProductVariantsForDropdown = createServerFn({ method: 'GET' })
    .middleware([canManageStockBatchesMiddleware])
    .handler(async () => {
        const db = dbClient();

        const variants = await db
            .select({
                id: productVariantTable.id,
                name: productVariantTable.name,
                sku: productVariantTable.sku,
                product_name: productTable.name,
                product_id: productTable.id,
            })
            .from(productVariantTable)
            .leftJoin(productTable, eq(productVariantTable.product_id, productTable.id))
            .orderBy(asc(productTable.name), asc(productVariantTable.name));

        return {
            status: "SUCCESS",
            data: variants,
        };
    });
