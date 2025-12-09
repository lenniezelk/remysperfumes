import { createServerFn } from "@tanstack/react-start";
import { asc, desc, like, isNotNull, isNull, SQL, count, and, or } from "drizzle-orm";
import { canManageSuppliersMiddleware } from "../middleware/canManageSuppliers";
import type { Result } from "@/lib/types";
import type { Supplier } from "@/lib/types/supplier";
import dbClient from "@/lib/db/client";
import { supplierTable } from "@/lib/db/schema";
import { z } from "zod";
import type { PaginatedListResponse } from "@/lib/types/common";

export const ListSuppliersParams = z.object({
    searchQuery: z.string().default(""),
    sort: z.enum(["name", "created_at"]).default("created_at"),
    order: z.enum(["asc", "desc"]).default("desc"),
    page: z.int().nonnegative().default(1),
    limit: z.int().nonnegative().default(10),
    showDeleted: z.boolean().default(false),
})

export const listSuppliers = createServerFn({ method: 'GET' })
    .middleware([canManageSuppliersMiddleware])
    .inputValidator(ListSuppliersParams)
    .handler(async (ctx): Promise<Result<PaginatedListResponse<Supplier>>> => {
        const db = dbClient();
        const params = ctx.data;

        const filters: SQL[] = [];

        if (params.showDeleted) {
            filters.push(isNotNull(supplierTable.deleted_at));
        } else {
            filters.push(isNull(supplierTable.deleted_at));
        }

        if (params.searchQuery) {
            filters.push(
                or(
                    like(supplierTable.name, `%${params.searchQuery}%`),
                    like(supplierTable.contact_info, `%${params.searchQuery}%`)
                )!
            );
        }

        const orderBy: SQL[] = [];

        if (params.sort && params.order) {
            if (params.sort === "name") {
                orderBy.push(params.order === "asc" ? asc(supplierTable.name) : desc(supplierTable.name));
            } else if (params.sort === "created_at") {
                orderBy.push(params.order === "asc" ? asc(supplierTable.created_at) : desc(supplierTable.created_at));
            }
        }

        const page = params.page || 1;
        const limit = params.limit || 10;
        const offset = (page - 1) * limit;

        const suppliers = await db
            .select()
            .from(supplierTable)
            .where(and(...filters))
            .orderBy(...orderBy)
            .limit(limit)
            .offset(offset);

        const total = await db
            .select({ count: count() })
            .from(supplierTable)
            .where(and(...filters));

        return {
            status: "SUCCESS",
            data: {
                items: suppliers,
                total: total[0].count,
                page,
                limit,
                offset,
            }
        };
    });
