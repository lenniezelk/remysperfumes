import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
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
import type { Result } from '@/lib/types'

export const UpdateSaleItemData = z.object({
  saleItemId: z.string(),
  sale_id: z.string({ message: 'Sale is required' }),
  product_variant_id: z.string({ message: 'Product variant is required' }),
  quantity_sold: z.number().int().positive('Quantity must be positive'),
  price_at_sale: z.number().int().positive('Price must be positive'),
})

export const updateSaleItem = createServerFn({ method: 'POST' })
  .middleware([canManageSalesMiddleware])
  .inputValidator(UpdateSaleItemData)
  .handler(
    async (
      ctx,
    ): Promise<
      Result<typeof saleItemTable.$inferSelect> & {
        exhaustedBatches?: string[]
      }
    > => {
      const {
        saleItemId,
        sale_id,
        product_variant_id,
        quantity_sold,
        price_at_sale,
      } = ctx.data

      const db = dbClient()

      // Get existing sale item
      const saleItem = await db
        .select()
        .from(saleItemTable)
        .where(eq(saleItemTable.id, saleItemId))
        .get()

      if (!saleItem) {
        return {
          status: 'ERROR',
          error: 'Sale item not found',
        }
      }

      // Verify sale exists
      const sale = await db
        .select()
        .from(saleTable)
        .where(eq(saleTable.id, sale_id))
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
        .where(eq(productVariantTable.id, product_variant_id))
        .get()

      if (!productVariant) {
        return {
          status: 'ERROR',
          error: 'Product variant not selected',
        }
      }

      // If product variant or quantity changed, we need to re-allocate batches
      const needsReallocation =
        product_variant_id !== saleItem.product_variant_id ||
        quantity_sold !== saleItem.quantity_sold

      let exhaustedBatches: string[] = []

      if (needsReallocation) {
        // Get current batch allocations
        const currentAllocations = await db
          .select()
          .from(saleItemBatchTable)
          .where(eq(saleItemBatchTable.sale_item_id, saleItemId))

        // Restore stock from all current batches
        for (const allocation of currentAllocations) {
          const stockBatch = await db
            .select()
            .from(stockBatchTable)
            .where(eq(stockBatchTable.id, allocation.stock_batch_id))
            .get()

          if (stockBatch) {
            await db
              .update(stockBatchTable)
              .set({
                quantity_remaining:
                  stockBatch.quantity_remaining +
                  allocation.quantity_from_batch,
                updated_at: new Date(),
              })
              .where(eq(stockBatchTable.id, allocation.stock_batch_id))
          }
        }

        // Delete old batch allocation records
        await db
          .delete(saleItemBatchTable)
          .where(eq(saleItemBatchTable.sale_item_id, saleItemId))

        // Allocate new batches using FIFO
        const allocationResult = await allocateBatchesForSaleItem(
          db,
          product_variant_id,
          quantity_sold,
        )

        if (allocationResult.status === 'ERROR') {
          // If we can't allocate, restore the old allocations
          for (const allocation of currentAllocations) {
            await db.insert(saleItemBatchTable).values({
              id: allocation.id,
              sale_item_id: allocation.sale_item_id,
              stock_batch_id: allocation.stock_batch_id,
              quantity_from_batch: allocation.quantity_from_batch,
              cost_from_batch: allocation.cost_from_batch,
              created_at: allocation.created_at,
            })

            // Restore previous stock levels
            const stockBatch = await db
              .select()
              .from(stockBatchTable)
              .where(eq(stockBatchTable.id, allocation.stock_batch_id))
              .get()

            if (stockBatch) {
              await db
                .update(stockBatchTable)
                .set({
                  quantity_remaining:
                    stockBatch.quantity_remaining -
                    allocation.quantity_from_batch,
                  updated_at: new Date(),
                })
                .where(eq(stockBatchTable.id, allocation.stock_batch_id))
            }
          }

          return allocationResult
        }

        const { allocations, exhaustedBatches: newExhaustedBatches } =
          allocationResult.data
        if (newExhaustedBatches) {
          exhaustedBatches = newExhaustedBatches
        }

        // Calculate weighted average cost
        const totalCost = allocations.reduce(
          (sum, alloc) => sum + alloc.quantity * alloc.cost,
          0,
        )
        const averageCost = Math.round(totalCost / quantity_sold)

        // Create new batch allocation records
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

        // Update sale item with new cost
        await db
          .update(saleItemTable)
          .set({
            sale_id,
            product_variant_id,
            quantity_sold,
            price_at_sale,
            cost_at_sale: averageCost,
            updated_at: new Date(),
          })
          .where(eq(saleItemTable.id, saleItemId))
      } else {
        // Only price changed, no need to reallocate
        await db
          .update(saleItemTable)
          .set({
            sale_id,
            price_at_sale,
            updated_at: new Date(),
          })
          .where(eq(saleItemTable.id, saleItemId))
      }

      const updatedSaleItem = await db
        .select()
        .from(saleItemTable)
        .where(eq(saleItemTable.id, saleItemId))
        .get()

      if (!updatedSaleItem) {
        return {
          status: 'ERROR',
          error: 'Failed to retrieve updated sale item',
        }
      }

      // Update the sale's total_amount
      // Calculate the difference between the old and new sale item totals
      const oldTotal = saleItem.quantity_sold * saleItem.price_at_sale
      const newTotal =
        updatedSaleItem.quantity_sold * updatedSaleItem.price_at_sale
      const difference = newTotal - oldTotal

      if (difference !== 0) {
        await db
          .update(saleTable)
          .set({
            total_amount: (sale.total_amount || 0) + difference,
            updated_at: new Date(),
          })
          .where(eq(saleTable.id, sale_id))
      }

      return {
        status: 'SUCCESS',
        data: updatedSaleItem,
        ...(exhaustedBatches.length > 0 && { exhaustedBatches }),
      } as any
    },
  )
