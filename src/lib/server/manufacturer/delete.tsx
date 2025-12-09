import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { canManageManufacturersMiddleware } from "@/lib/server/middleware/canManageManufacturers";
import dbClient from "@/lib/db/client";
import { manufacturerTable } from "@/lib/db/schema";
import type { Result } from "@/lib/types";

export const DeleteManufacturerInput = z.object({
    manufacturerId: z.uuid(),
})

export const deleteManufacturer = createServerFn({ method: 'POST' })
    .middleware([canManageManufacturersMiddleware])
    .inputValidator(DeleteManufacturerInput)
    .handler(async (ctx): Promise<Result<null>> => {
        const { manufacturerId } = ctx.data;

        const db = dbClient();

        // check if manufacturer exists
        const manufacturer = await db.select().from(manufacturerTable).where(eq(manufacturerTable.id, manufacturerId)).get();
        if (!manufacturer) {
            return {
                status: "ERROR",
                error: "Manufacturer not found",
            };
        }

        // Soft delete: set deleted_at to current timestamp
        await db.update(manufacturerTable)
            .set({
                deleted_at: new Date(),
                updated_at: new Date(),
            })
            .where(eq(manufacturerTable.id, manufacturerId));

        return {
            status: "SUCCESS",
            data: null,
        };
    });

export const RestoreManufacturerInput = z.object({
    manufacturerId: z.uuid(),
})

export const restoreManufacturer = createServerFn({ method: 'POST' })
    .middleware([canManageManufacturersMiddleware])
    .inputValidator(RestoreManufacturerInput)
    .handler(async (ctx): Promise<Result<null>> => {
        const { manufacturerId } = ctx.data;

        const db = dbClient();

        // check if manufacturer exists
        const manufacturer = await db.select().from(manufacturerTable).where(eq(manufacturerTable.id, manufacturerId)).get();
        if (!manufacturer) {
            return {
                status: "ERROR",
                error: "Manufacturer not found",
            };
        }

        // Restore: set deleted_at to null
        await db.update(manufacturerTable)
            .set({
                deleted_at: null,
                updated_at: new Date(),
            })
            .where(eq(manufacturerTable.id, manufacturerId));

        return {
            status: "SUCCESS",
            data: null,
        };
    });