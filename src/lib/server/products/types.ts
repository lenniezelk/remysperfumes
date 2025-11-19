import { productTable } from '@/lib/db/schema'
import { z } from 'zod'

// Category Type
export type Product = typeof productTable.$inferSelect

export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().min(1).max(100).default(10),
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

export type PaginationInput = z.infer<typeof paginationSchema>

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
