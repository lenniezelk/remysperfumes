import { createServerFn } from "@tanstack/react-start";
import { eq, isNull, and } from "drizzle-orm";
import { z } from "zod";
import { canManageProductVariantsMiddleware } from "@/lib/server/middleware/canManageProductVariants";
import type { Result } from "@/lib/types";
import type { ProductVariant } from "@/lib/types/product-variant";
import dbClient from "@/lib/db/client";
import { productVariantTable } from "@/lib/db/schema";

const ListProductVariantsByProductInput = z.object({
    product_id: z.string(),
});

export const listProductVariantsByProduct = createServerFn({ method: 'GET' })
    .middleware([canManageProductVariantsMiddleware])
    .inputValidator(ListProductVariantsByProductInput)
    .handler(async (ctx): Promise<Result<Array<ProductVariant>>> => {
        const db = dbClient();

        const productVariants = await db
            .select()
            .from(productVariantTable)
            .where(and(
                eq(productVariantTable.product_id, ctx.data.product_id),
                isNull(productVariantTable.deleted_at)
            ))
            .orderBy(productVariantTable.created_at);

        return {
            status: "SUCCESS",
            data: productVariants,
        };
    });
