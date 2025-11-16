import { createServerFn } from '@tanstack/react-start'
import db from '@/lib/db/client'
import { categoryTable } from '@/lib/db/schema'
import { desc, sql, eq } from 'drizzle-orm'
import {
  paginationSchema,
  categorySchema,
  individualCategorySchema,
  updateCategorySchema,
  type UpdateCategoryInput,
  type PaginationInput,
  type CreateCategoryInput,
} from './types'

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

// POST function to create a category
export const createCategory = createServerFn({
  method: 'POST',
})
  .inputValidator(categorySchema)
  .handler(async ({ data }: { data: CreateCategoryInput }) => {
    const parsed = categorySchema.safeParse(data)

    if (!parsed.success) {
      // Map issues into a key-based object
      const fieldErrors: Record<string, string[]> = {}
      parsed.error.issues.forEach((issue) => {
        const pathKey = String(issue.path[0] ?? '_')
        if (!fieldErrors[pathKey]) fieldErrors[pathKey] = []
        fieldErrors[pathKey].push(issue.message)
      })

      return { error: fieldErrors }
    }

    const { name, description } = parsed.data

    await db()
      .insert(categoryTable)
      .values({
        name,
        description: description ?? '',
      })

    return { success: true }
  })

// POST function to update a category
export const updateCategory = createServerFn({
  method: 'POST',
})
  .inputValidator(updateCategorySchema)
  .handler(async ({ data }: { data: UpdateCategoryInput }) => {
    const parsed = updateCategorySchema.safeParse(data)

    if (!parsed.success) {
      // Map issues into a key-based object
      const fieldErrors: Record<string, string[]> = {}
      parsed.error.issues.forEach((issue) => {
        const pathKey = String(issue.path[0] ?? '_')
        if (!fieldErrors[pathKey]) fieldErrors[pathKey] = []
        fieldErrors[pathKey].push(issue.message)
      })

      return { error: fieldErrors }
    }

    const { id, name, description } = parsed.data

    // Perform update
    await db()
      .update(categoryTable)
      .set({
        name,
        description: description ?? '',
        updated_at: new Date(),
      })
      .where(eq(categoryTable.id, id))

    return { success: true }
  })

// Get function to get a category by ID
export const getCategoryById = createServerFn({ method: 'GET' })
  .inputValidator(individualCategorySchema)
  .handler(async ({ data }: { data: { id: string } }) => {
    const { id } = data

    try {
      const category = await db()
        .select()
        .from(categoryTable)
        .where(eq(categoryTable.id, id))
        .limit(1)
        .then((rows) => rows[0] || null)

      if (!category) {
        return { success: false, data: null, message: 'Category not found' }
      }

      return { success: true, data: category, message: 'Category retrieved' }
    } catch (error) {
      console.error('Error getting category by ID:', error)
      return {
        success: false,
        data: null,
        message: 'Failed to retrieve category',
      }
    }
  })

// Delete function to delete a category by ID
export const deleteCategory = createServerFn({
  method: 'POST',
})
  .inputValidator(individualCategorySchema)
  .handler(async ({ data }: { data: { id: string } }) => {
    const { id } = data

    try {
      await db().delete(categoryTable).where(eq(categoryTable.id, id))

      return { success: true }
    } catch (error) {
      console.error('Error deleting category:', error)
      return { success: false, message: 'Failed to delete category' }
    }
  })
