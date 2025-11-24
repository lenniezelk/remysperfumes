import { createServerFn } from "@tanstack/react-start";
import { desc } from "drizzle-orm";
import { canManageProductVariantsMiddleware } from "../middleware/canManageProductVariants";
import type { Result } from "@/lib/types";
import type { ProductVariant } from "@/lib/types/product-variant";
import dbClient from "@/lib/db/client";
import { productVariantTable } from "@/lib/db/schema";

export const listProductVariants = createServerFn({ method: 'GET' })
    .middleware([canManageProductVariantsMiddleware])
    .handler(async (): Promise<Result<Array<ProductVariant>>> => {
        const db = dbClient();

        const productVariants = await db.select().from(productVariantTable).orderBy(desc(productVariantTable.created_at));

        return {
            status: "SUCCESS",
            data: productVariants,
        };
    });
