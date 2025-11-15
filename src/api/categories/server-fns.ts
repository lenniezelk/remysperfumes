import { createServerFn } from '@tanstack/react-start'
import db from '@/lib/db/client'
import { categoryTable } from '@/lib/db/schema'
import { desc, sql } from 'drizzle-orm'
import { paginationSchema, type PaginationInput } from './types'

// Server function to list categories with pagination (with Zod validation)
export const listCategoriesPaginated = createServerFn({ method: 'GET' })
  .inputValidator(paginationSchema)
  .handler(async ({ data }: { data: PaginationInput }) => {
    const { page, pageSize } = data
    const offset = (page - 1) * pageSize

    try {
      const categories = await db()
        .select()
        .from(categoryTable)
        .orderBy(desc(categoryTable.created_at))
        .limit(pageSize)
        .offset(offset)

      // Get total count for pagination info
      const totalResult = await db()
        .select({ count: sql<number>`count(*)` })
        .from(categoryTable)
      const total = totalResult[0]?.count || 0
      const totalPages = Math.ceil(total / pageSize)

      return {
        success: true,
        data: {
          categories,
          pagination: {
            page,
            pageSize,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
          },
        },
        message: 'Categories retrieved successfully',
      }
    } catch (error) {
      console.error('Error listing categories:', error)
      return {
        success: false,
        data: null,
        message: 'Failed to retrieve categories',
      }
    }
  })
