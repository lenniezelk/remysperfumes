import { createServerFn } from '@tanstack/react-start'
import { desc, eq, isNull, sql } from 'drizzle-orm'
import { canManageCategoriesMiddleware } from '../middleware/canManageCategories'
import {
  categorySchema,
  individualCategorySchema,
  paginationSchema,
  updateCategorySchema,
} from './types'
import type {
  CreateCategoryInput,
  PaginationInput,
  UpdateCategoryInput,
} from './types'
import db from '@/lib/db/client'
import { categoryTable, productTable } from '@/lib/db/schema'

// server function to get all categories without pagination
export const getAllCategories = createServerFn({ method: 'GET' })
  .middleware([canManageCategoriesMiddleware])
  .handler(async () => {
    try {
      const categories = await db()
        .select()
        .from(categoryTable)
        .where(isNull(categoryTable.deleted_at))
        .orderBy(desc(categoryTable.created_at))

      return {
        success: true,
        data: categories,
        message: 'Categories retrieved successfully',
      }
    } catch (error) {
      console.error('Error retrieving categories:', error)
      return {
        success: false,
        data: null,
        message: 'Failed to retrieve categories',
      }
    }
  })

// Server function to list categories with pagination (with Zod validation)
export const listCategoriesPaginated = createServerFn({ method: 'GET' })
  .middleware([canManageCategoriesMiddleware])
  .inputValidator(paginationSchema)
  .handler(async ({ data }: { data: PaginationInput }) => {
    const { page, pageSize } = data
    const offset = (page - 1) * pageSize

    try {
      const categories = await db()
        .select()
        .from(categoryTable)
        .where(isNull(categoryTable.deleted_at))
        .orderBy(desc(categoryTable.created_at))
        .limit(pageSize)
        .offset(offset)

      // Get total count for pagination info
      const totalResult = await db()
        .select({ count: sql<number>`count(*)` })
        .from(categoryTable)
        .where(isNull(categoryTable.deleted_at))
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
  .middleware([canManageCategoriesMiddleware])
  .inputValidator(categorySchema)
  .handler(async ({ data }: { data: CreateCategoryInput }) => {
    const parsed = categorySchema.safeParse(data)

    if (!parsed.success) {
      // Map issues into a key-based object
      const fieldErrors: Record<string, Array<string>> = {}
      parsed.error.issues.forEach((issue) => {
        const pathKey = String(issue.path[0] ?? '_')
        if (!fieldErrors[pathKey]) fieldErrors[pathKey] = []
        fieldErrors[pathKey].push(issue.message)
      })

      return { error: fieldErrors }
    }

    const { name, description } = parsed.data

    const result = await db()
      .insert(categoryTable)
      .values({
        name,
        description: description ?? '',
      })
      .returning()

    return {
      success: true,
      data: result[0],
      message: 'Category created successfully',
    }
  })

// POST function to update a category
export const updateCategory = createServerFn({
  method: 'POST',
})
  .middleware([canManageCategoriesMiddleware])
  .inputValidator(updateCategorySchema)
  .handler(async ({ data }: { data: UpdateCategoryInput }) => {
    const parsed = updateCategorySchema.safeParse(data)

    if (!parsed.success) {
      // Map issues into a key-based object
      const fieldErrors: Record<string, Array<string>> = {}
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
  .middleware([canManageCategoriesMiddleware])
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
  .middleware([canManageCategoriesMiddleware])
  .inputValidator(individualCategorySchema)
  .handler(async ({ data }: { data: { id: string } }) => {
    const { id } = data

    const category = db()
      .select()
      .from(categoryTable)
      .where(eq(categoryTable.id, id))
    if (!category) {
      return {
        status: 'ERROR',
        error: 'Category not found',
      }
    }

    const products = await db()
      .select()
      .from(productTable)
      .where(eq(productTable.category_id, id))
      .limit(1)

    if (products.length > 0) {
      return {
        status: 'ERROR',
        error: 'Cannot delete category. Category has products',
      }
    }

    // Soft delete: set deleted_at to current timestamp
    await db()
      .update(categoryTable)
      .set({ deleted_at: new Date() })
      .where(eq(categoryTable.id, id))

    return {
      status: 'SUCCESS',
      data: null,
    }
  })
