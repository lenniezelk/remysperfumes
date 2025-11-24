import { createSelectSchema, createUpdateSchema } from "drizzle-zod";
import type { z } from "zod";
import { manufacturerTable } from "@/lib/db/schema";

const manufacturerDBSchema = createSelectSchema(manufacturerTable)
export type ManufacturerDB = z.infer<typeof manufacturerDBSchema>;

export interface Manufacturer extends ManufacturerDB { }

export const manufacturerCreateSchema = createUpdateSchema(manufacturerTable);
export type ManufacturerCreateData = Omit<z.infer<typeof manufacturerCreateSchema>, 'id' | 'created_at' | 'updated_at'>;

export const manufacturerUpdateSchema = createUpdateSchema(manufacturerTable);
export type ManufacturerUpdateData = Omit<z.infer<typeof manufacturerUpdateSchema>, 'id' | 'created_at'>;