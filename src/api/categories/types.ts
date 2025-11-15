import { categoryTable } from '@/lib/db/schema'
import { z } from 'zod'

// Category Type
export type Category = typeof categoryTable.$inferSelect

// Zod Schema for Category
export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().min(1).max(100).default(10),
})

export type PaginationInput = z.infer<typeof paginationSchema>
