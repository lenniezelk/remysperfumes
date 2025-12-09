import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import type { Result } from '@/lib/types'
import { canManageSalesMiddleware } from '@/lib/server/middleware/canManageSales'
import dbClient from '@/lib/db/client'
import {
  saleTable,
  saleItemTable,
  saleItemBatchTable,
  productVariantTable,
  stockBatchTable,
} from '@/lib/db/schema'
import { allocateBatchesForSaleItem } from './allocate-batches'

export const CreateSaleItemInput = z.object({
  sale_id: z.string({ message: 'Sale is required' }),
  product_variant_id: z.string({ message: 'Product variant is required' }),
  quantity_sold: z.number().int().positive('Quantity must be positive'),
  price_at_sale: z.number().int().positive('Price must be positive'),
})

export const createSaleItem = createServerFn({ method: 'POST' })
  .middleware([canManageSalesMiddleware])
  .inputValidator(CreateSaleItemInput)
  .handler(
    async (
      ctx,
    ): Promise<
      Result<typeof saleItemTable.$inferSelect> & {
        exhaustedBatches?: string[]
      }
    > => {
      const db = dbClient()
      const data = ctx.data

      // Verify sale exists
      const sale = await db
        .select()
        .from(saleTable)
        .where(eq(saleTable.id, data.sale_id))
        .get()

      if (!sale) {
        return {
          status: 'ERROR',
          error: 'Sale not found',
        }
      }

      // Verify product variant exists
      const productVariant = await db
        .select()
        .from(productVariantTable)
        .where(eq(productVariantTable.id, data.product_variant_id))
        .get()

      if (!productVariant) {
        return {
          status: 'ERROR',
          error: 'Product variant not selected',
        }
      }

      // Allocate stock from available batches using FIFO
      const allocationResult = await allocateBatchesForSaleItem(
        db,
        data.product_variant_id,
        data.quantity_sold,
      )

      if (allocationResult.status === 'ERROR') {
        return allocationResult
      }

      const { allocations, exhaustedBatches } = allocationResult.data

      // Calculate weighted average cost
      const totalCost = allocations.reduce(
        (sum, alloc) => sum + alloc.quantity * alloc.cost,
        0,
      )
      const averageCost = Math.round(totalCost / data.quantity_sold)

      // Create the sale item
      const saleItemId = crypto.randomUUID()
      const newSaleItem = {
        id: saleItemId,
        sale_id: data.sale_id,
        product_variant_id: data.product_variant_id,
        quantity_sold: data.quantity_sold,
        price_at_sale: data.price_at_sale,
        cost_at_sale: averageCost,
        created_at: new Date(),
        updated_at: new Date(),
      }

      const insertedSaleItem = await db
        .insert(saleItemTable)
        .values(newSaleItem)
        .returning()

      // Create junction table records for each batch allocation
      for (const allocation of allocations) {
        await db.insert(saleItemBatchTable).values({
          id: crypto.randomUUID(),
          sale_item_id: saleItemId,
          stock_batch_id: allocation.batchId,
          quantity_from_batch: allocation.quantity,
          cost_from_batch: allocation.cost,
          created_at: new Date(),
        })

        // Update stock batch quantity
        const batch = await db
          .select()
          .from(stockBatchTable)
          .where(eq(stockBatchTable.id, allocation.batchId))
          .get()

        if (batch) {
          await db
            .update(stockBatchTable)
            .set({
              quantity_remaining:
                batch.quantity_remaining - allocation.quantity,
              updated_at: new Date(),
            })
            .where(eq(stockBatchTable.id, allocation.batchId))
        }
      }

      return {
        status: 'SUCCESS',
        data: insertedSaleItem[0],
        ...(exhaustedBatches.length > 0 && { exhaustedBatches }),
      }
    },
  )
