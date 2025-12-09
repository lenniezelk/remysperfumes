import { createServerFn } from "@tanstack/react-start";
import { asc, desc, eq, SQL, and, or, count, like, isNotNull, isNull, gte, lte } from "drizzle-orm";
import dbClient from "@/lib/db/client";
import { stockBatchTable, productTable, productVariantTable, supplierTable } from "@/lib/db/schema";
import { canManageSalesMiddleware } from "../middleware/canManageSales";
import { z } from "zod";
import type { Result } from "@/lib/types";
import type { PaginatedListResponse } from "@/lib/types/common";

export const ListStockBatchesParams = z.object({
    searchQuery: z.string().default(""),
    sort: z.enum(["received_at", "created_at", "total_price", "buy_price_per_unit", "product_name"]).default("received_at"),
    order: z.enum(["asc", "desc"]).default("desc"),
    page: z.number().int().nonnegative().default(1),
    limit: z.number().int().nonnegative().default(10),
    showDeleted: z.boolean().default(false),
    from: z.number().optional(),
    to: z.number().optional(),
})

export const listStockBatches = createServerFn({ method: 'GET' })
    .middleware([canManageSalesMiddleware])
    .inputValidator(ListStockBatchesParams)
    .handler(async (ctx): Promise<Result<PaginatedListResponse<any>>> => {
        const db = dbClient();
        const params = ctx.data;

        const filters: SQL[] = [];

        if (params.showDeleted) {
            filters.push(isNotNull(stockBatchTable.deleted_at));
        } else {
            filters.push(isNull(stockBatchTable.deleted_at));
        }

        if (params.from) {
            filters.push(gte(stockBatchTable.received_at, new Date(params.from)));
        }

        if (params.to) {
            filters.push(lte(stockBatchTable.received_at, new Date(params.to)));
        }

        if (params.searchQuery) {
            filters.push(
                or(
                    like(productTable.name, `%${params.searchQuery}%`),
                    like(productVariantTable.name, `%${params.searchQuery}%`),
                    like(supplierTable.name, `%${params.searchQuery}%`),
                    like(productVariantTable.sku, `%${params.searchQuery}%`)
                )!
            );
        }

        const orderBy: SQL[] = [];

        if (params.sort && params.order) {
            if (params.sort === "received_at") {
                orderBy.push(params.order === "asc" ? asc(stockBatchTable.received_at) : desc(stockBatchTable.received_at));
            } else if (params.sort === "created_at") {
                orderBy.push(params.order === "asc" ? asc(stockBatchTable.created_at) : desc(stockBatchTable.created_at));
            } else if (params.sort === "buy_price_per_unit") {
                orderBy.push(params.order === "asc" ? asc(stockBatchTable.buy_price_per_unit) : desc(stockBatchTable.buy_price_per_unit));
            } else if (params.sort === "product_name") {
                orderBy.push(params.order === "asc" ? asc(productTable.name) : desc(productTable.name));
            }
        }

        const page = params.page || 1;
        const limit = params.limit || 10;
        const offset = (page - 1) * limit;

        const stockBatches = await db
            .select({
                id: stockBatchTable.id,
                product_variant_id: stockBatchTable.product_variant_id,
                quantity_received: stockBatchTable.quantity_received,
                quantity_remaining: stockBatchTable.quantity_remaining,
                buy_price_per_unit: stockBatchTable.buy_price_per_unit,
                sell_price_per_unit: stockBatchTable.sell_price_per_unit,
                min_sale_price_per_unit: stockBatchTable.min_sale_price_per_unit,
                received_at: stockBatchTable.received_at,
                created_at: stockBatchTable.created_at,
                updated_at: stockBatchTable.updated_at,
                supplier: stockBatchTable.supplier,
                deleted_at: stockBatchTable.deleted_at,
                product_name: productTable.name,
                variant_name: productVariantTable.name,
                supplier_name: supplierTable.name
            })
            .from(stockBatchTable)
            .leftJoin(productVariantTable, eq(stockBatchTable.product_variant_id, productVariantTable.id))
            .leftJoin(productTable, eq(productVariantTable.product_id, productTable.id))
            .leftJoin(supplierTable, eq(stockBatchTable.supplier, supplierTable.id))
            .where(and(...filters))
            .orderBy(...orderBy)
            .limit(limit)
            .offset(offset);

        // Calculate total count
        const totalResult = await db
            .select({ count: count() })
            .from(stockBatchTable)
            .leftJoin(productVariantTable, eq(stockBatchTable.product_variant_id, productVariantTable.id))
            .leftJoin(productTable, eq(productVariantTable.product_id, productTable.id))
            .leftJoin(supplierTable, eq(stockBatchTable.supplier, supplierTable.id))
            .where(and(...filters));

        const total = totalResult[0]?.count || 0;

        return {
            status: "SUCCESS",
            data: {
                items: stockBatches,
                total: total,
                page,
                limit,
                offset,
            }
        };
    });
