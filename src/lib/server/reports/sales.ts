import { createServerFn } from '@tanstack/react-start'
import { and, asc, gte, lte, sql, sum, count, isNull, desc } from 'drizzle-orm'
import { canManageSalesMiddleware } from '@/lib/server/middleware/canManageSales'
import type { Result } from '@/lib/types'
import dbClient from '@/lib/db/client'
import {
  saleTable,
  saleItemTable,
  productVariantTable,
  productTable,
  categoryTable,
  saleItemBatchTable,
  stockBatchTable,
  supplierTable,
} from '@/lib/db/schema'
import { z } from 'zod'

export const SalesReportParams = z.object({
  from: z.number().optional(),
  to: z.number().optional(),
  grouping: z.enum(['day', 'week', 'month']).default('day'),
})

export type SalesReportSummary = {
  totalRevenue: number
  totalTransactions: number
  averageTransactionValue: number
  grossProfit: number
  margin: number
}

export type ProductPerformance = {
  bestSellers: Array<{
    productId: string
    productName: string
    revenue: number
    quantity: number
  }>
  categoryPerformance: Array<{
    categoryId: string
    categoryName: string
    revenue: number
  }>
  variantPerformance: Array<{
    variantId: string
    variantName: string
    sku: string
    productName: string
    revenue: number
    quantity: number
  }>
}

export type InventoryInsights = {
  batchMovement: Array<{
    batchId: string
    productName: string
    variantName: string
    quantitySold: number
    remainingStock: number
    costOfGoodsSold: number
  }>
  supplierPerformance: Array<{
    supplierId: string
    supplierName: string
    revenue: number
    unitsSold: number
  }>
  pricingAnalysis: Array<{
    productId: string
    productName: string
    variantName: string
    batchId: string
    targetSellPrice: number
    actualAvgSellPrice: number
    variance: number
    quantitySold: number
  }>
}

export type SalesReportData = {
  summary: SalesReportSummary
  chartData: Array<{
    date: string
    revenue: number
    profit: number
    transactions: number
  }>
  productPerformance: ProductPerformance
  inventoryInsights: InventoryInsights
}

export const getSalesReport = createServerFn({ method: 'GET' })
  .middleware([canManageSalesMiddleware])
  .inputValidator(SalesReportParams)
  .handler(async (ctx): Promise<Result<SalesReportData>> => {
    const db = dbClient()
    const params = ctx.data

    const filters = [isNull(saleTable.deleted_at)]

    if (params.from) {
      filters.push(gte(saleTable.date, new Date(params.from)))
    }

    if (params.to) {
      filters.push(lte(saleTable.date, new Date(params.to)))
    }

    // Fetch raw sales data
    const sales = await db
      .select({
        id: saleTable.id,
        date: saleTable.date,
        total_amount: saleTable.total_amount,
      })
      .from(saleTable)
      .where(and(...filters))
      .orderBy(asc(saleTable.date))

    // Fetch raw sale items for these sales with product details
    const saleItems = await db
      .select({
        sale_id: saleItemTable.sale_id,
        cost_at_sale: saleItemTable.cost_at_sale,
        price_at_sale: saleItemTable.price_at_sale,
        quantity_sold: saleItemTable.quantity_sold,
        variant_id: productVariantTable.id,
        variant_name: productVariantTable.name,
        sku: productVariantTable.sku,
        product_id: productTable.id,
        product_name: productTable.name,
        category_id: categoryTable.id,
        category_name: categoryTable.name,
      })
      .from(saleItemTable)
      .innerJoin(saleTable, sql`${saleItemTable.sale_id} = ${saleTable.id}`)
      .innerJoin(
        productVariantTable,
        sql`${saleItemTable.product_variant_id} = ${productVariantTable.id}`,
      )
      .innerJoin(
        productTable,
        sql`${productVariantTable.product_id} = ${productTable.id}`,
      )
      .innerJoin(
        categoryTable,
        sql`${productTable.category_id} = ${categoryTable.id}`,
      )
      .where(and(...filters))

    // Fetch sale item batches for inventory insights
    const saleItemBatches = await db
      .select({
        sale_item_id: saleItemBatchTable.sale_item_id,
        quantity_from_batch: saleItemBatchTable.quantity_from_batch,
        cost_from_batch: saleItemBatchTable.cost_from_batch,
        batch_id: stockBatchTable.id,
        quantity_remaining: stockBatchTable.quantity_remaining,
        sell_price_per_unit: stockBatchTable.sell_price_per_unit,
        supplier_id: supplierTable.id,
        supplier_name: supplierTable.name,
        // Need product details to link back
        variant_name: productVariantTable.name,
        product_name: productTable.name,
        product_id: productTable.id,
        price_at_sale: saleItemTable.price_at_sale, // Total price for the item line
        quantity_sold_item: saleItemTable.quantity_sold, // Total qty for the item line
      })
      .from(saleItemBatchTable)
      .innerJoin(
        stockBatchTable,
        sql`${saleItemBatchTable.stock_batch_id} = ${stockBatchTable.id}`,
      )
      .leftJoin(
        supplierTable,
        sql`${stockBatchTable.supplier} = ${supplierTable.id}`,
      )
      .innerJoin(
        saleItemTable,
        sql`${saleItemBatchTable.sale_item_id} = ${saleItemTable.id}`,
      )
      .innerJoin(saleTable, sql`${saleItemTable.sale_id} = ${saleTable.id}`)
      .innerJoin(
        productVariantTable,
        sql`${stockBatchTable.product_variant_id} = ${productVariantTable.id}`,
      )
      .innerJoin(
        productTable,
        sql`${productVariantTable.product_id} = ${productTable.id}`,
      )
      .where(and(...filters))

    // Aggregation in JS
    let totalRevenue = 0
    let totalTransactions = sales.length
    let totalCost = 0

    const salesMap = new Map<
      string,
      { revenue: number; cost: number; transactions: number }
    >()

    // Product Performance Maps
    const productMap = new Map<
      string,
      { name: string; revenue: number; quantity: number }
    >()
    const categoryMap = new Map<string, { name: string; revenue: number }>()
    const variantMap = new Map<
      string,
      {
        name: string
        sku: string
        productName: string
        revenue: number
        quantity: number
      }
    >()

    // Process Sales
    for (const sale of sales) {
      totalRevenue += sale.total_amount

      const dateObj = new Date(sale.date)
      const dateKey = dateObj.toISOString().split('T')[0] // UTC date

      if (!salesMap.has(dateKey)) {
        salesMap.set(dateKey, { revenue: 0, cost: 0, transactions: 0 })
      }
      const entry = salesMap.get(dateKey)!
      entry.revenue += sale.total_amount
      entry.transactions += 1
    }

    // Process Items for Cost and Product Performance
    const saleIdToDateMap = new Map(
      sales.map((s) => [s.id, new Date(s.date).toISOString().split('T')[0]]),
    )

    for (const item of saleItems) {
      totalCost += item.cost_at_sale

      // Chart Data Aggregation
      const dateKey = saleIdToDateMap.get(item.sale_id)
      if (dateKey && salesMap.has(dateKey)) {
        const entry = salesMap.get(dateKey)!
        entry.cost += item.cost_at_sale
      }

      // Product Aggregation
      if (!productMap.has(item.product_id)) {
        productMap.set(item.product_id, {
          name: item.product_name,
          revenue: 0,
          quantity: 0,
        })
      }
      const prod = productMap.get(item.product_id)!
      prod.revenue += item.price_at_sale
      prod.quantity += item.quantity_sold

      // Category Aggregation
      if (!categoryMap.has(item.category_id)) {
        categoryMap.set(item.category_id, {
          name: item.category_name,
          revenue: 0,
        })
      }
      const cat = categoryMap.get(item.category_id)!
      cat.revenue += item.price_at_sale

      // Variant Aggregation
      if (!variantMap.has(item.variant_id)) {
        variantMap.set(item.variant_id, {
          name: item.variant_name,
          sku: item.sku,
          productName: item.product_name,
          revenue: 0,
          quantity: 0,
        })
      }
      const variant = variantMap.get(item.variant_id)!
      variant.revenue += item.price_at_sale
      variant.quantity += item.quantity_sold
      variant.quantity += item.quantity_sold
    }

    // Inventory Insights Aggregation
    const batchMap = new Map<
      string,
      {
        productName: string
        variantName: string
        quantitySold: number
        remainingStock: number
        costOfGoodsSold: number
      }
    >()
    const supplierMap = new Map<
      string,
      { name: string; revenue: number; unitsSold: number }
    >()
    const pricingMap = new Map<
      string, // Composite key: batchId
      {
        productId: string
        productName: string
        variantName: string
        targetSellPrice: number
        totalSellPrice: number
        quantitySold: number
      }
    >()

    for (const batchItem of saleItemBatches) {
      // Batch Movement
      if (!batchMap.has(batchItem.batch_id)) {
        batchMap.set(batchItem.batch_id, {
          productName: batchItem.product_name,
          variantName: batchItem.variant_name,
          quantitySold: 0,
          remainingStock: batchItem.quantity_remaining,
          costOfGoodsSold: 0,
        })
      }
      const batch = batchMap.get(batchItem.batch_id)!
      batch.quantitySold += batchItem.quantity_from_batch
      batch.costOfGoodsSold += batchItem.cost_from_batch

      // Supplier Performance
      if (batchItem.supplier_id) {
        if (!supplierMap.has(batchItem.supplier_id)) {
          supplierMap.set(batchItem.supplier_id, {
            name: batchItem.supplier_name!,
            revenue: 0,
            unitsSold: 0,
          })
        }
        const supplier = supplierMap.get(batchItem.supplier_id)!
        // Pro-rate revenue based on quantity from this batch vs total quantity in the line item
        // Revenue for this batch portion = (Item Price / Item Qty) * Batch Qty
        const unitPrice =
          batchItem.quantity_sold_item > 0
            ? batchItem.price_at_sale / batchItem.quantity_sold_item
            : 0
        const revenueFromBatch = unitPrice * batchItem.quantity_from_batch

        supplier.revenue += revenueFromBatch
        supplier.unitsSold += batchItem.quantity_from_batch
      }

      // Pricing Analysis
      if (!pricingMap.has(batchItem.batch_id)) {
        pricingMap.set(batchItem.batch_id, {
          productId: batchItem.product_id,
          productName: batchItem.product_name,
          variantName: batchItem.variant_name,
          targetSellPrice: batchItem.sell_price_per_unit,
          totalSellPrice: 0,
          quantitySold: 0,
        })
      }
      const pricing = pricingMap.get(batchItem.batch_id)!
      const unitPrice =
        batchItem.quantity_sold_item > 0
          ? batchItem.price_at_sale / batchItem.quantity_sold_item
          : 0
      pricing.totalSellPrice += unitPrice * batchItem.quantity_from_batch
      pricing.quantitySold += batchItem.quantity_from_batch
    }

    const grossProfit = totalRevenue - totalCost
    const margin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0
    const averageTransactionValue =
      totalTransactions > 0 ? totalRevenue / totalTransactions : 0

    const chartData = Array.from(salesMap.entries())
      .map(([date, data]) => ({
        date,
        revenue: data.revenue,
        profit: data.revenue - data.cost,
        transactions: data.transactions,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    const bestSellers = Array.from(productMap.entries())
      .map(([id, data]) => ({
        productId: id,
        productName: data.name,
        revenue: data.revenue,
        quantity: data.quantity,
      }))
      .sort((a, b) => b.revenue - a.revenue)

    const categoryPerformance = Array.from(categoryMap.entries())
      .map(([id, data]) => ({
        categoryId: id,
        categoryName: data.name,
        revenue: data.revenue,
      }))
      .sort((a, b) => b.revenue - a.revenue)

    const variantPerformance = Array.from(variantMap.entries())
      .map(([id, data]) => ({
        variantId: id,
        variantName: data.name,
        sku: data.sku,
        productName: data.productName,
        revenue: data.revenue,
        quantity: data.quantity,
      }))
      .sort((a, b) => b.revenue - a.revenue)

    const batchMovement = Array.from(batchMap.entries())
      .map(([id, data]) => ({
        batchId: id,
        ...data,
      }))
      .sort((a, b) => b.quantitySold - a.quantitySold)

    const supplierPerformance = Array.from(supplierMap.entries())
      .map(([id, data]) => ({
        supplierId: id,
        supplierName: data.name,
        revenue: data.revenue,
        unitsSold: data.unitsSold,
      }))
      .sort((a, b) => b.revenue - a.revenue)

    const pricingAnalysis = Array.from(pricingMap.entries())
      .map(([id, data]) => ({
        batchId: id,
        productId: data.productId,
        productName: data.productName,
        variantName: data.variantName,
        targetSellPrice: data.targetSellPrice,
        actualAvgSellPrice:
          data.quantitySold > 0 ? data.totalSellPrice / data.quantitySold : 0,
        variance:
          data.quantitySold > 0
            ? data.totalSellPrice / data.quantitySold - data.targetSellPrice
            : 0,
        quantitySold: data.quantitySold,
      }))
      .sort((a, b) => a.variance - b.variance) // Sort by biggest negative variance first (underpriced)

    return {
      status: 'SUCCESS',
      data: {
        summary: {
          totalRevenue,
          totalTransactions,
          averageTransactionValue,
          grossProfit,
          margin,
        },
        chartData,
        productPerformance: {
          bestSellers,
          categoryPerformance,
          variantPerformance,
        },
        inventoryInsights: {
          batchMovement,
          supplierPerformance,
          pricingAnalysis,
        },
      },
    }
  })
