import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { canManageSalesMiddleware } from '@/lib/server/middleware/canManageSales'
import dbClient from '@/lib/db/client'
import {
  saleTable,
  saleItemTable,
  saleItemBatchTable,
  stockBatchTable,
} from '@/lib/db/schema'

export const DeleteSaleItemInput = z.object({
  saleItemId: z.string(),
})

export const deleteSaleItem = createServerFn({ method: 'POST' })
  .middleware([canManageSalesMiddleware])
  .inputValidator(DeleteSaleItemInput)
  .handler(async (ctx) => {
    const { saleItemId } = ctx.data

    const db = dbClient()

    // Check if sale item exists
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

    // Get all batch allocations for this sale item
    const batchAllocations = await db
      .select()
      .from(saleItemBatchTable)
      .where(eq(saleItemBatchTable.sale_item_id, saleItemId))

    // Restore quantity to each stock batch
    for (const allocation of batchAllocations) {
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
              stockBatch.quantity_remaining + allocation.quantity_from_batch,
            updated_at: new Date(),
          })
          .where(eq(stockBatchTable.id, allocation.stock_batch_id))
      }
    }

    // Update the sale's total_amount by subtracting this item's total
    const sale = await db
      .select()
      .from(saleTable)
      .where(eq(saleTable.id, saleItem.sale_id))
      .get()

    if (sale) {
      const saleItemTotal = saleItem.quantity_sold * saleItem.price_at_sale
      await db
        .update(saleTable)
        .set({
          total_amount: (sale.total_amount || 0) - saleItemTotal,
          updated_at: new Date(),
        })
        .where(eq(saleTable.id, saleItem.sale_id))
    }

    // Soft delete: set deleted_at to current timestamp
    await db
      .update(saleItemTable)
      .set({ deleted_at: new Date() })
      .where(eq(saleItemTable.id, saleItemId))

    return {
      status: 'SUCCESS',
      data: null,
    }
  })
