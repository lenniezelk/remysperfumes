import { createServerFn } from "@tanstack/react-start";
import { canManageManufacturersMiddleware } from "@/lib/server/middleware/canManageManufacturers";
import { z } from "zod";
import dbClient from "@/lib/db/client";
import { manufacturerTable } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const DeleteManufacturerInput = z.object({
    manufacturerId: z.uuid(),
})

export const deleteManufacturer = createServerFn({ method: 'POST' })
    .middleware([canManageManufacturersMiddleware])
    .inputValidator(DeleteManufacturerInput)
    .handler(async (ctx) => {
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
            .set({ deleted_at: new Date() })
            .where(eq(manufacturerTable.id, manufacturerId));

        return {
            status: "SUCCESS",
            data: null,
        };
    });