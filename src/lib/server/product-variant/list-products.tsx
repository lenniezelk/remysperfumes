import { createServerFn } from "@tanstack/react-start";
import type { Result } from "@/lib/types";
import { canManageProductVariantsMiddleware } from "@/lib/server/middleware/canManageProductVariants";
import dbClient from "@/lib/db/client";
import { productTable } from "@/lib/db/schema";

export interface ProductForDropdown {
    id: string;
    name: string;
}

export const listProductsForDropdown = createServerFn({ method: 'GET' })
    .middleware([canManageProductVariantsMiddleware])
    .handler(async (): Promise<Result<Array<ProductForDropdown>>> => {
        const db = dbClient();

        const products = await db
            .select({
                id: productTable.id,
                name: productTable.name,
            })
            .from(productTable)
            .orderBy(productTable.name);

        return {
            status: "SUCCESS",
            data: products,
        };
    });
