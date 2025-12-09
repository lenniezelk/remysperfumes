import { z } from 'zod'
import type { productTable } from '@/lib/db/schema'

// Category Type
export type Product = typeof productTable.$inferSelect

export const ListProductsParams = z.object({
  searchQuery: z.string().default(""),
  sort: z.enum(["name", "created_at", "default_sell_price"]).default("created_at"),
  order: z.enum(["asc", "desc"]).default("desc"),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().min(1).max(100).default(10),
  showDeleted: z.boolean().default(false),
  category_id: z.string().uuid().optional(),
  manufacturer_id: z.string().uuid().optional(),
})

// Zod Schema for Product
export const createProductSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string(),

  category_id: z.string().min(1, 'Category is required'),

  brand: z.string(),

  default_sell_price: z
    .number({ message: 'Price must be a number and is required' })
    .int('Price must be an integer')
    .nonnegative('Price cannot be negative'),

  manufacturer: z.string(),
})

export type PaginationInput = z.infer<typeof ListProductsParams>

// zod validation for updating product
export const updateProductSchema = z.object({
  id: z.string().uuid('Invalid product ID'),
  name: z.string().min(1, 'Name is required'),
  description: z.string(),

  category_id: z.string().uuid('Invalid category ID'),

  brand: z.string(),

  default_sell_price: z
    .number({ message: 'Price must be a number and is required' })
    .int('Price must be an integer')
    .nonnegative('Price cannot be negative'),

  manufacturer: z.string(),
})

export type CreateProductInput = z.infer<typeof createProductSchema>

export type UpdateProductInput = z.infer<typeof updateProductSchema>

// Zod valiadion for deleting category
export const uuidSchema = z.object({
  id: z.string().uuid('Invalid category ID'),
})
