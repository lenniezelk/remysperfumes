import { createSelectSchema, createUpdateSchema } from "drizzle-zod";
import type { z } from "zod";
import { saleTable } from "../db/schema";

export const saleSelectSchema = createSelectSchema(saleTable);
export type SaleDB = z.infer<typeof saleSelectSchema>;

export interface Sale extends SaleDB { }

export const saleCreateSchema = createUpdateSchema(saleTable);
export type SaleCreateData = Omit<z.infer<typeof saleCreateSchema>, 'id' | 'created_at' | 'updated_at'>;

export const saleUpdateSchema = createUpdateSchema(saleTable);
export type SaleUpdateData = Omit<z.infer<typeof saleUpdateSchema>, 'id' | 'created_at'>;
