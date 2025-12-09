import { createServerFn } from "@tanstack/react-start";
import { asc, desc, like, isNotNull, isNull, SQL, count, and, or, gte, lte, sql } from "drizzle-orm";
import { canManageSalesMiddleware } from "@/lib/server/middleware/canManageSales";
import type { Result } from "@/lib/types";
import { Sale } from "@/lib/types/sales";
import dbClient from "@/lib/db/client";
import { saleTable } from "@/lib/db/schema";
import { z } from "zod";
import type { PaginatedListResponse } from "@/lib/types/common";

export const ListSalesParams = z.object({
    searchQuery: z.string().default(""),
    sort: z.enum(["date", "total_amount", "customer_name"]).default("date"),
    order: z.enum(["asc", "desc"]).default("desc"),
    page: z.number().int().nonnegative().default(1),
    limit: z.number().int().nonnegative().default(10),
    showDeleted: z.boolean().default(false),
    from: z.number().optional(),
    to: z.number().optional(),
})

export const listSales = createServerFn({ method: 'GET' })
    .middleware([canManageSalesMiddleware])
    .inputValidator(ListSalesParams)
    .handler(async (ctx): Promise<Result<PaginatedListResponse<Sale> & { totalAmount: number }>> => {
        const db = dbClient();
        const params = ctx.data;

        const filters: SQL[] = [];

        if (params.showDeleted) {
            filters.push(isNotNull(saleTable.deleted_at));
        } else {
            filters.push(isNull(saleTable.deleted_at));
        }

        if (params.from) {
            filters.push(gte(saleTable.date, new Date(params.from)));
        }

        if (params.to) {
            filters.push(lte(saleTable.date, new Date(params.to)));
        }

        if (params.searchQuery) {
            filters.push(
                or(
                    like(saleTable.customer_name, `%${params.searchQuery}%`),
                    like(saleTable.customer_contact, `%${params.searchQuery}%`)
                )!
            );
        }

        const orderBy: SQL[] = [];

        if (params.sort && params.order) {
            if (params.sort === "date") {
                orderBy.push(params.order === "asc" ? asc(saleTable.date) : desc(saleTable.date));
            } else if (params.sort === "total_amount") {
                orderBy.push(params.order === "asc" ? asc(saleTable.total_amount) : desc(saleTable.total_amount));
            } else if (params.sort === "customer_name") {
                orderBy.push(params.order === "asc" ? asc(saleTable.customer_name) : desc(saleTable.customer_name));
            }
        }

        const page = params.page || 1;
        const limit = params.limit || 10;
        const offset = (page - 1) * limit;

        const sales = await db
            .select()
            .from(saleTable)
            .where(and(...filters))
            .orderBy(...orderBy)
            .limit(limit)
            .offset(offset);

        // Calculate count and total amount in one go if possible, or separate queries.
        // Drizzle doesn't support multiple aggregations in .select({ count: count() }) easily with typed results sometimes, separate is safer.
        // Actually .select({ count: count(), totalAmount: sql<number>`sum(${saleTable.total_amount})` }) works.

        const summary = await db
            .select({
                count: count(),
                totalAmount: sql<number>`sum(${saleTable.total_amount})`
            })
            .from(saleTable)
            .where(and(...filters));

        const total = summary[0]?.count || 0;
        const totalAmount = summary[0]?.totalAmount || 0;

        return {
            status: "SUCCESS",
            data: {
                items: sales,
                total: total,
                totalAmount: totalAmount,
                page,
                limit,
                offset,
            }
        };
    });
