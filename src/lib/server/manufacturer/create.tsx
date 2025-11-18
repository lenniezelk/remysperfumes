import { createServerFn } from "@tanstack/react-start";
import { canManageManufacturersMiddleware } from "@/lib/server/middleware/canManageManufacturers";
import dbClient from "@/lib/db/client";
import { manufacturerTable } from "@/lib/db/schema";
import { z } from "zod";
import { Manufacturer } from "@/lib/types/manufacturer";
import { Result } from "@/lib/types";

export const CreateManufacturerInput = z.object({
    name: z.string().min(1, "Name is required"),
    contact_info: z.string(),
});

export const createManufacturer = createServerFn({ method: 'POST' })
    .middleware([canManageManufacturersMiddleware])
    .inputValidator(CreateManufacturerInput)
    .handler(async (ctx): Promise<Result<Manufacturer>> => {
        const db = dbClient();

        const data = ctx.data;

        const newManufacturer: Manufacturer = {
            id: crypto.randomUUID(),
            name: data.name,
            contact_info: data.contact_info,
            created_at: new Date(),
            updated_at: new Date(),
        };

        await db.insert(manufacturerTable).values(newManufacturer);

        return {
            status: "SUCCESS",
            data: newManufacturer,
        }
    });
