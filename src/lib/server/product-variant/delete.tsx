import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { canManageProductVariantsMiddleware } from "@/lib/server/middleware/canManageProductVariants";
import dbClient from "@/lib/db/client";
import { productVariantTable } from "@/lib/db/schema";

export const DeleteProductVariantInput = z.object({
    productVariantId: z.string(),
})

export const deleteProductVariant = createServerFn({ method: 'POST' })
    .middleware([canManageProductVariantsMiddleware])
    .inputValidator(DeleteProductVariantInput)
    .handler(async (ctx) => {
        const { productVariantId } = ctx.data;

        const db = dbClient();

        // check if product variant exists
        const productVariant = await db.select().from(productVariantTable).where(eq(productVariantTable.id, productVariantId)).get();
        if (!productVariant) {
            return {
                status: "ERROR",
                error: "Product variant not found",
            };
        }

        // Soft delete: set deleted_at to current timestamp
        await db.update(productVariantTable)
            .set({ deleted_at: new Date() })
            .where(eq(productVariantTable.id, productVariantId));

        return {
            status: "SUCCESS",
            data: null,
        };
    });
