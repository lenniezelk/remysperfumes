import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { canManageProductVariantsMiddleware } from "../middleware/canManageProductVariants";
import type { Result } from "@/lib/types";
import type { ProductVariant } from "@/lib/types/product-variant";
import dbClient from "@/lib/db/client";
import { productVariantTable } from "@/lib/db/schema";

const GetProductVariantInput = z.object({
    productVariantId: z.string(),
});

export const getProductVariantById = createServerFn({ method: 'GET' })
    .middleware([canManageProductVariantsMiddleware])
    .inputValidator(GetProductVariantInput)
    .handler(async (ctx): Promise<Result<ProductVariant>> => {
        const db = dbClient();

        const productVariant = await db
            .select()
            .from(productVariantTable)
            .where(eq(productVariantTable.id, ctx.data.productVariantId))
            .get();

        if (!productVariant) {
            return {
                status: "ERROR",
                error: "Product variant not found",
            };
        }

        return {
            status: "SUCCESS",
            data: productVariant,
        };
    });
