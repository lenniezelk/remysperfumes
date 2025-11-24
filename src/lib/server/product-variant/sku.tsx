import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { eq } from "drizzle-orm";
import type { Result } from "@/lib/types";
import { canManageProductVariantsMiddleware } from "@/lib/server/middleware/canManageProductVariants";
import dbClient from "@/lib/db/client";
import { productTable, productVariantTable } from "@/lib/db/schema";

export const GenerateSkuInput = z.object({
    product_id: z.string({ message: 'Product ID is required' }),
    variant_name: z.string().min(1, "Variant name is required"),
});

/**
 * Creates a new product SKU by generating it from the product's information and variant name
 * The SKU format is: [BRAND-]PRODUCT-VARIANT (uppercase, spaces replaced with hyphens)
 * Brand is included if available
 */
export const createProductSku = createServerFn({ method: 'POST' })
    .middleware([canManageProductVariantsMiddleware])
    .inputValidator(GenerateSkuInput)
    .handler(async (ctx): Promise<Result<{ sku: string }>> => {
        const db = dbClient();
        const data = ctx.data;

        // Fetch the product to get its details
        const product = await db
            .select()
            .from(productTable)
            .where(eq(productTable.id, data.product_id))
            .get();

        if (!product) {
            return {
                status: "ERROR",
                error: "Product not found",
            };
        }

        // Helper function to slugify text
        const slugify = (text: string) => {
            return text
                .trim()
                .toUpperCase()
                .replace(/\s+/g, '-')
                .replace(/[^A-Z0-9-]/g, '');
        };

        // Generate SKU components
        const productSlug = slugify(product.name);
        const variantSlug = slugify(data.variant_name);

        // Include brand if available for more specific SKUs
        const brandSlug = product.brand ? slugify(product.brand) : null;

        // Build base SKU: BRAND-PRODUCT-VARIANT or PRODUCT-VARIANT if no brand
        let baseSku = brandSlug
            ? `${brandSlug}-${productSlug}-${variantSlug}`
            : `${productSlug}-${variantSlug}`;

        let sku = baseSku;
        let suffix = 1;

        // Check if SKU already exists, if so, append a number
        while (true) {
            const existingSku = await db
                .select()
                .from(productVariantTable)
                .where(eq(productVariantTable.sku, sku))
                .get();

            if (!existingSku) {
                break;
            }

            // SKU exists, try with a suffix
            sku = `${baseSku}-${suffix}`;
            suffix++;
        }

        return {
            status: "SUCCESS",
            data: { sku },
        };
    });
