import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { eq } from "drizzle-orm";
import type { ProductVariant } from "@/lib/types/product-variant";
import type { Result } from "@/lib/types";
import { canManageProductVariantsMiddleware } from "@/lib/server/middleware/canManageProductVariants";
import dbClient from "@/lib/db/client";
import { productTable, productVariantTable } from "@/lib/db/schema";
import { env } from "cloudflare:workers";
import { base64ToBlob, uploadToCloudflareImages, validateBase64Image } from "@/lib/utils/image";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const CreateProductVariantInput = z.object({
    product_id: z.string({ message: 'Product is required' }),
    name: z.string().min(1, "Variant name is required"),
    sku: z.string().min(1, "SKU is required"),
    default_sell_price: z.number().int().positive("Sell price must be positive"),
    productImage: z.string(), // Base64 encoded image string
}).superRefine((data, ctx) => {
    if (data.productImage) {
        if (!validateBase64Image(data.productImage)) {
            ctx.addIssue({
                code: "custom",
                message: "Invalid base64 image format",
            });
        }

        const fileSize = atob(data.productImage.split(',')[1]).length;
        if (fileSize > MAX_FILE_SIZE) {
            ctx.addIssue({
                code: "custom",
                message: `Image file size exceeds limit of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
            });
        }

        if (fileSize === 0) {
            ctx.addIssue({
                code: "custom",
                message: "Image file is empty",
            });
        }
    }
});

export const createProductVariant = createServerFn({ method: 'POST' })
    .middleware([canManageProductVariantsMiddleware])
    .inputValidator(CreateProductVariantInput)
    .handler(async (ctx): Promise<Result<ProductVariant>> => {
        const db = dbClient();

        const data = ctx.data;

        // Verify product exists
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

        // Check if SKU is unique
        const existingSku = await db
            .select()
            .from(productVariantTable)
            .where(eq(productVariantTable.sku, data.sku))
            .get();

        if (existingSku) {
            return {
                status: "ERROR",
                error: "SKU already exists",
            };
        }

        const newProductVariant: ProductVariant = {
            id: crypto.randomUUID(),
            product_id: data.product_id,
            name: data.name,
            sku: data.sku,
            default_sell_price: data.default_sell_price || null,
            image: null,
            created_at: new Date(),
            updated_at: new Date(),
        };

        const insertedProductVariant = await db.insert(productVariantTable).values(newProductVariant).returning();

        let image: string | null = null;
        if (data.productImage) {
            // Convert base64 to blob
            const blobResult = base64ToBlob(data.productImage);
            if (!blobResult) {
                return {
                    status: "ERROR",
                    error: "Invalid image format",
                };
            }

            // Upload to Cloudflare Images
            const imageUrl = await uploadToCloudflareImages(
                blobResult.blob,
                `variant-${insertedProductVariant[0].id}.jpg`,
                { variant_id: insertedProductVariant[0].id },
                env.CLOUDFLARE_ACCOUNT_ID,
                env.CLOUDFLARE_STREAM_IMAGES_ANALYTICS_TOKEN
            );

            if (imageUrl) {
                image = imageUrl;
            }
        }

        if (image) {
            await db.update(productVariantTable).set({ image }).where(eq(productVariantTable.id, insertedProductVariant[0].id));
        }

        return {
            status: "SUCCESS",
            data: newProductVariant,
        }
    });
