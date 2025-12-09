import { createServerFn } from "@tanstack/react-start";
import { asc, desc, like, isNotNull, isNull, SQL, count, and, or } from "drizzle-orm";
import { canManageManufacturersMiddleware } from "../middleware/canManageManufacturers";
import type { Result } from "@/lib/types";
import type { Manufacturer } from "@/lib/types/manufacturer";
import dbClient from "@/lib/db/client";
import { manufacturerTable } from "@/lib/db/schema";
import { z } from "zod";
import type { PaginatedListResponse } from "@/lib/types/common";

export const ListManufacturersParams = z.object({
    searchQuery: z.string().default(""),
    sort: z.enum(["name", "created_at"]).default("created_at"),
    order: z.enum(["asc", "desc"]).default("desc"),
    page: z.int().nonnegative().default(1),
    limit: z.int().nonnegative().default(10),
    showDeleted: z.boolean().default(false),
})

export const listManufacturers = createServerFn({ method: 'GET' })
    .middleware([canManageManufacturersMiddleware])
    .inputValidator(ListManufacturersParams)
    .handler(async (ctx): Promise<Result<PaginatedListResponse<Manufacturer>>> => {
        const db = dbClient();
        const params = ctx.data;

        const filters: SQL[] = [];

        if (params.showDeleted) {
            filters.push(isNotNull(manufacturerTable.deleted_at));
        } else {
            filters.push(isNull(manufacturerTable.deleted_at));
        }

        if (params.searchQuery) {
            filters.push(
                or(
                    like(manufacturerTable.name, `%${params.searchQuery}%`),
                    like(manufacturerTable.contact_info, `%${params.searchQuery}%`)
                )!
            );
        }

        const orderBy: SQL[] = [];

        if (params.sort && params.order) {
            if (params.sort === "name") {
                orderBy.push(params.order === "asc" ? asc(manufacturerTable.name) : desc(manufacturerTable.name));
            } else if (params.sort === "created_at") {
                orderBy.push(params.order === "asc" ? asc(manufacturerTable.created_at) : desc(manufacturerTable.created_at));
            }
        }

        const page = params.page || 1;
        const limit = params.limit || 10;
        const offset = (page - 1) * limit;

        const manufacturers = await db
            .select()
            .from(manufacturerTable)
            .where(and(...filters))
            .orderBy(...orderBy)
            .limit(limit)
            .offset(offset);

        const total = await db
            .select({ count: count() })
            .from(manufacturerTable)
            .where(and(...filters));

        return {
            status: "SUCCESS",
            data: {
                items: manufacturers,
                total: total[0].count,
                page,
                limit,
                offset,
            }
        };
    });
