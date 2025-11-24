import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { canManageProductVariantsMiddleware } from "../middleware/canManageProductVariants";
import dbClient from "@/lib/db/client";
import { productTable, productVariantTable } from "@/lib/db/schema";
import { env } from "cloudflare:workers";
import { base64ToBlob, uploadToCloudflareImages, validateBase64Image } from "@/lib/utils/image";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB


export const UpdateProductVariantData = z.object({
    productVariantId: z.string(),
    product_id: z.string().min(1, "Product is required"),
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

export const updateProductVariant = createServerFn({ method: 'POST' })
    .middleware([canManageProductVariantsMiddleware])
    .inputValidator(UpdateProductVariantData)
    .handler(async (ctx) => {
        const { productVariantId, product_id, name, sku, default_sell_price, productImage } = ctx.data;

        const db = dbClient();

        const productVariant = await db.select().from(productVariantTable).where(eq(productVariantTable.id, productVariantId)).get();

        if (!productVariant) {
            return {
                status: "ERROR",
                error: "Product variant not found",
            };
        }

        // Verify product exists
        const product = await db
            .select()
            .from(productTable)
            .where(eq(productTable.id, product_id))
            .get();

        if (!product) {
            return {
                status: "ERROR",
                error: "Product not found",
            };
        }

        // Check if SKU is unique (if it changed)
        if (sku !== productVariant.sku) {
            const existingSku = await db
                .select()
                .from(productVariantTable)
                .where(eq(productVariantTable.sku, sku))
                .get();

            if (existingSku) {
                return {
                    status: "ERROR",
                    error: "SKU already exists",
                };
            }
        }

        // Handle image upload if productImage is provided
        let imageUrl: string | null = productVariant.image; // Keep existing image by default

        if (productImage) {
            // Convert base64 to blob
            const blobResult = base64ToBlob(productImage);
            if (!blobResult) {
                return {
                    status: "ERROR",
                    error: "Invalid image format",
                };
            }

            // Upload to Cloudflare Images
            const newImageUrl = await uploadToCloudflareImages(
                blobResult.blob,
                `variant-${productVariantId}.jpg`,
                { variant_id: productVariantId },
                env.CLOUDFLARE_ACCOUNT_ID,
                env.CLOUDFLARE_STREAM_IMAGES_ANALYTICS_TOKEN
            );

            if (newImageUrl) {
                imageUrl = newImageUrl;
            }
        }

        const updatedFields: Partial<typeof productVariantTable.$inferSelect> = {
            product_id,
            name,
            sku,
            default_sell_price: default_sell_price || null,
            image: imageUrl,
            updated_at: new Date(),
        };

        await db.update(productVariantTable)
            .set(updatedFields)
            .where(eq(productVariantTable.id, productVariantId));

        const updatedProductVariant = await db.select().from(productVariantTable).where(eq(productVariantTable.id, productVariantId)).get();

        return {
            status: "SUCCESS",
            data: updatedProductVariant,
        };
    });
