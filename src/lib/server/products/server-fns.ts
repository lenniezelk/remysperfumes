import { createServerFn } from '@tanstack/react-start'
import { desc, eq, sql } from 'drizzle-orm'
import { canManageProductsMiddleware } from '../middleware/canManageProducts'
import {



  createProductSchema,
  paginationSchema,
  updateProductSchema,
  uuidSchema
} from './types'
import type { CreateProductInput, PaginationInput, UpdateProductInput } from './types';
import dbClient from '@/lib/db/client'
import { categoryTable, manufacturerTable, productTable } from '@/lib/db/schema'

const db = dbClient()

// Server function to list products with pagination (with Zod validation)
export const listProductsPaginated = createServerFn({ method: 'GET' })
  .middleware([canManageProductsMiddleware])
  .inputValidator(paginationSchema)
  .handler(async ({ data }: { data: PaginationInput }) => {
    const { page, pageSize } = data
    const offset = (page - 1) * pageSize

    try {
      const products = await db
        .select({
          id: productTable.id,
          name: productTable.name,
          description: productTable.description,
          brand: productTable.brand,
          default_sell_price: productTable.default_sell_price,
          created_at: productTable.created_at,
          updated_at: productTable.updated_at,
          category_id: productTable.category_id,
          category_name: categoryTable.name, // 🎯 JOINED column
          manufacturer_name: manufacturerTable.name, // 🎯 JOINED column
        })
        .from(productTable)
        .leftJoin(categoryTable, eq(productTable.category_id, categoryTable.id))
        .leftJoin(
          manufacturerTable,
          eq(productTable.manufacturer, manufacturerTable.id),
        )
        .where(sql`${productTable.deleted_at} IS NULL`)
        .orderBy(desc(productTable.created_at))
        .limit(pageSize)
        .offset(offset)

      // Get total count for pagination info (excluding deleted)
      const totalResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(productTable)
        .where(sql`${productTable.deleted_at} IS NULL`)
      const total = totalResult[0]?.count || 0
      const totalPages = Math.ceil(total / pageSize)

      return {
        success: true,
        data: {
          products,
          pagination: {
            page,
            pageSize,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
          },
        },
        message: 'Products retrieved successfully',
      }
    } catch (error) {
      console.error('Error listing products:', error)
      return {
        success: false,
        data: null,
        message: 'Failed to retrieve products',
      }
    }
  })

// POST function to create a product
export const createProduct = createServerFn({
  method: 'POST',
})
  .middleware([canManageProductsMiddleware])
  .inputValidator(createProductSchema)
  .handler(async ({ data }: { data: CreateProductInput }) => {
    try {
      const result = await db
        .insert(productTable)
        .values({
          name: data.name,
          description: data.description ?? null,
          category_id: data.category_id,
          brand: data.brand ?? null,
          default_sell_price: data.default_sell_price,
          manufacturer: data.manufacturer == '' ? null : data.manufacturer,
        })
        .returning()

      return {
        success: true,
        data: result[0],
        message: 'Product created successfully',
      }
    } catch (error) {
      console.error('Error creating product:', error)
      return {
        success: false,
        data: null,
        message: 'Failed to create product',
      }
    }
  })

// POST function to update a product
export const updateProduct = createServerFn({
  method: 'POST',
})
  .middleware([canManageProductsMiddleware])
  .inputValidator(updateProductSchema)
  .handler(async ({ data }: { data: UpdateProductInput }) => {
    try {
      await db
        .update(productTable)
        .set({
          name: data.name,
          description: data.description,
          category_id: data.category_id,
          brand: data.brand,
          default_sell_price: data.default_sell_price,
          manufacturer: data.manufacturer === '' ? null : data.manufacturer,
          updated_at: new Date(),
        })
        .where(eq(productTable.id, data.id))

      return {
        success: true,
        message: 'Product updated successfully',
      }
    } catch (error) {
      console.error('Error updating product:', error)
      return {
        success: false,
        message: 'Failed to update product',
      }
    }
  })

// Get function to get a category by ID
export const getProductById = createServerFn({ method: 'GET' })
  .middleware([canManageProductsMiddleware])
  .inputValidator(uuidSchema)
  .handler(async ({ data }: { data: { id: string } }) => {
    const { id } = data

    try {
      const product = await db
        .select()
        .from(productTable)
        .where(eq(productTable.id, id))
        .limit(1)
        .then((rows) => rows[0] || null)

      if (!product) {
        return { success: false, data: null, message: 'Category not found' }
      }

      return { success: true, data: product, message: 'Category retrieved' }
    } catch (error) {
      return {
        success: false,
        data: null,
        message: `Failed to retrieve category ${error}`,
      }
    }
  })

// DELETE function to delete a product by ID (soft delete)
export const deleteProduct = createServerFn({
  method: 'POST',
})
  .middleware([canManageProductsMiddleware])
  .inputValidator(uuidSchema)
  .handler(async ({ data }: { data: { id: string } }) => {
    try {
      // Soft delete: set deleted_at to current timestamp
      await db
        .update(productTable)
        .set({ deleted_at: new Date() })
        .where(eq(productTable.id, data.id))

      return { success: true, message: 'Product deleted successfully' }
    } catch (error) {
      console.error('Error deleting product:', error)
      return { success: false, message: 'Failed to delete product' }
    }
  })
