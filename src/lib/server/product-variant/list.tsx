import { createServerFn } from "@tanstack/react-start";
import { desc, eq,isNull } from "drizzle-orm";
import type { Result } from "@/lib/types";
import type { ProductVariant } from "@/lib/types/product-variant";
import dbClient from "@/lib/db/client";
import { productVariantTable, productTable } from "@/lib/db/schema";
import { canManageSalesMiddleware } from "../middleware/canManageSales";

export const listProductVariants = createServerFn({ method: 'GET' })
    .middleware([canManageSalesMiddleware])
    .handler(async (): Promise<Result<Array<ProductVariant>>> => {
        const db = dbClient();

        const productVariants = await db
            .select({
                id: productVariantTable.id,
                product_id: productVariantTable.product_id,
                name: productVariantTable.name,
                sku: productVariantTable.sku,
                default_sell_price: productVariantTable.default_sell_price,
                image: productVariantTable.image,
                created_at: productVariantTable.created_at,
                updated_at: productVariantTable.updated_at,
                deleted_at: productVariantTable.deleted_at,
                product_name: productTable.name,
            })
            .from(productVariantTable)
            .leftJoin(productTable, eq(productVariantTable.product_id, productTable.id))
            .where(isNull(productVariantTable.deleted_at))
            .orderBy(desc(productVariantTable.created_at));

        return {
            status: "SUCCESS",
            data: productVariants,
        };
    });
