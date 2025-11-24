import { createSelectSchema, createUpdateSchema } from "drizzle-zod";
import type { z } from "zod";
import { productVariantTable } from "@/lib/db/schema";

const productVariantDBSchema = createSelectSchema(productVariantTable)
export type ProductVariantDB = z.infer<typeof productVariantDBSchema>;

export interface ProductVariant extends ProductVariantDB { }

export const productVariantCreateSchema = createUpdateSchema(productVariantTable);
export type ProductVariantCreateData = Omit<z.infer<typeof productVariantCreateSchema>, 'id' | 'created_at' | 'updated_at'>;

export const productVariantUpdateSchema = createUpdateSchema(productVariantTable);
export type ProductVariantUpdateData = Omit<z.infer<typeof productVariantUpdateSchema>, 'id' | 'created_at'>;
