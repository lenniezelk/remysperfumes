import { eq } from 'drizzle-orm'
import type { Result } from '@/lib/types'
import { stockBatchTable } from '@/lib/db/schema'

export interface BatchAllocation {
  batchId: string
  quantity: number
  cost: number
}

export interface AllocationResult {
  allocations: Array<BatchAllocation>
  exhaustedBatches: Array<string> // IDs of batches that were fully consumed
}

/**
 * Allocate stock from available batches using FIFO (First-In-First-Out) strategy
 * Oldest batches (by received_at) are consumed first
 *
 * @param db - Database client
 * @param productVariantId - ID of the product variant to allocate stock for
 * @param quantityNeeded - Total quantity needed
 * @returns Array of batch allocations and list of exhausted batches, or error if insufficient stock
 */
export async function allocateBatchesForSaleItem(
  db: any,
  productVariantId: string,
  quantityNeeded: number,
): Promise<Result<AllocationResult>> {
  // Fetch all available batches for this product variant
  // Filter: quantity_remaining > 0 and not deleted
  // Sort: oldest first (FIFO based on received_at)
  const availableBatches = await db
    .select()
    .from(stockBatchTable)
    .where(eq(stockBatchTable.product_variant_id, productVariantId))
    .orderBy(stockBatchTable.received_at) // ASC by default (oldest first)

  // Filter out deleted batches and those with no stock
  const validBatches = availableBatches.filter(
    (batch: any) => !batch.deleted_at && batch.quantity_remaining > 0,
  )

  if (validBatches.length === 0) {
    return {
      status: 'ERROR',
      error: 'No available stock batches for this product variant',
    }
  }

  // Calculate total available quantity
  const totalAvailable = validBatches.reduce(
    (sum: number, batch: any) => sum + batch.quantity_remaining,
    0,
  )

  if (totalAvailable < quantityNeeded) {
    return {
      status: 'ERROR',
      error: `Insufficient stock. Available: ${totalAvailable}, Requested: ${quantityNeeded}`,
    }
  }

  // Allocate from batches using FIFO
  const allocations: Array<BatchAllocation> = []
  const exhaustedBatches: Array<string> = []
  let remainingQuantity = quantityNeeded

  for (const batch of validBatches) {
    if (remainingQuantity <= 0) break

    const quantityFromThisBatch = Math.min(
      batch.quantity_remaining,
      remainingQuantity,
    )

    allocations.push({
      batchId: batch.id,
      quantity: quantityFromThisBatch,
      cost: batch.buy_price_per_unit,
    })

    // Track if this batch will be exhausted
    if (quantityFromThisBatch === batch.quantity_remaining) {
      exhaustedBatches.push(batch.id)
    }

    remainingQuantity -= quantityFromThisBatch
  }

  return {
    status: 'SUCCESS',
    data: {
      allocations,
      exhaustedBatches,
    },
  }
}
