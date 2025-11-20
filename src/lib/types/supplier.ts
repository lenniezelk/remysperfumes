import { createSelectSchema, createUpdateSchema } from "drizzle-zod";
import { supplierTable } from "@/lib/db/schema";
import { z } from "zod";

const supplierDBSchema = createSelectSchema(supplierTable)
export type SupplierDB = z.infer<typeof supplierDBSchema>;

export interface Supplier extends SupplierDB { }

export const supplierCreateSchema = createUpdateSchema(supplierTable);
export type SupplierCreateData = Omit<z.infer<typeof supplierCreateSchema>, 'id' | 'created_at' | 'updated_at'>;

export const supplierUpdateSchema = createUpdateSchema(supplierTable);
export type SupplierUpdateData = Omit<z.infer<typeof supplierUpdateSchema>, 'id' | 'created_at'>;
