import { createServerFn } from "@tanstack/react-start";
import { canManageManufacturersMiddleware } from "../middleware/canManageManufacturers";
import { z } from "zod";
import dbClient from "@/lib/db/client";
import { manufacturerTable } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const GetManufacturerInput = z.object({
    manufacturerId: z.uuid(),
})

export const getManufacturerById = createServerFn({ method: 'GET' })
    .middleware([canManageManufacturersMiddleware])
    .inputValidator(GetManufacturerInput)
    .handler(async (ctx) => {
        const { manufacturerId } = ctx.data;

        const db = dbClient();

        const manufacturer = await db.select().from(manufacturerTable).where(eq(manufacturerTable.id, manufacturerId)).get();

        if (!manufacturer) {
            return {
                status: "ERROR",
                error: "Manufacturer not found",
            };
        }

        return {
            status: "SUCCESS",
            data: manufacturer,
        };
    });