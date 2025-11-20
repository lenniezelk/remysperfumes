import { createServerFn } from "@tanstack/react-start";
import { canManageManufacturersMiddleware } from "../middleware/canManageManufacturers";
import { z } from "zod";
import dbClient from "@/lib/db/client";
import { manufacturerTable } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const UpdateManufacturerData = z.object({
    manufacturerId: z.uuid(),
    name: z.string().min(1, 'Name is required'),
    contact_info: z.string(),
    restore_manufacturer: z.boolean(),
});

export const updateManufacturer = createServerFn({ method: 'POST' })
    .middleware([canManageManufacturersMiddleware])
    .inputValidator(UpdateManufacturerData)
    .handler(async (ctx) => {
        const { manufacturerId, name, contact_info, restore_manufacturer } = ctx.data;

        const db = dbClient();

        const manufacturer = await db.select().from(manufacturerTable).where(eq(manufacturerTable.id, manufacturerId)).get();

        if (!manufacturer) {
            return {
                status: "ERROR",
                error: "Manufacturer not found",
            };
        }

        const updatedFields: Partial<typeof manufacturerTable.$inferSelect> = {
            name,
            contact_info,
            updated_at: new Date(),
            deleted_at: restore_manufacturer ? null : manufacturer.deleted_at,
        };

        await db.update(manufacturerTable)
            .set(updatedFields)
            .where(eq(manufacturerTable.id, manufacturerId));

        const updatedManufacturer = await db.select().from(manufacturerTable).where(eq(manufacturerTable.id, manufacturerId)).get();

        return {
            status: "SUCCESS",
            data: updatedManufacturer,
        };
    });
