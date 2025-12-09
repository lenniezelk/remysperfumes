import { z } from 'zod'
import type { categoryTable } from '@/lib/db/schema'

// Category Type
export type Category = typeof categoryTable.$inferSelect

// Zod Schema for Category
export const ListCategoriesParams = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().min(1).max(100).default(10),
  searchQuery: z.string().default(""),
  sort: z.enum(["name", "created_at"]).default("created_at"),
  order: z.enum(["asc", "desc"]).default("desc"),
  showDeleted: z.boolean().default(false),
})

export type PaginationInput = z.infer<typeof ListCategoriesParams>

// Zod validation for category
export const categorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string(),
})

// zod validation for updating category
export const updateCategorySchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name is required'),
  description: z.string(),
})

export type CreateCategoryInput = z.infer<typeof categorySchema>

export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>

// Zod valiadion for deleting category
export const individualCategorySchema = z.object({
  id: z.string().uuid('Invalid category ID'),
})
