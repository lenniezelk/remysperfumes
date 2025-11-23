import { createSelectSchema, createUpdateSchema } from "drizzle-zod";
import { stockBatchTable } from "@/lib/db/schema";
import { z } from "zod";

const stockBatchDBSchema = createSelectSchema(stockBatchTable)
export type StockBatchDB = z.infer<typeof stockBatchDBSchema>;

export interface StockBatch extends StockBatchDB { }

export const stockBatchCreateSchema = createUpdateSchema(stockBatchTable);
export type StockBatchCreateData = Omit<z.infer<typeof stockBatchCreateSchema>, 'id' | 'created_at' | 'updated_at'>;

export const stockBatchUpdateSchema = createUpdateSchema(stockBatchTable);
export type StockBatchUpdateData = Omit<z.infer<typeof stockBatchUpdateSchema>, 'id' | 'created_at'>;
