import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import Button from '@/components/Button'
import Heading from '@/components/Heading'
import { queryOptions, useSuspenseQuery } from '@tanstack/react-query'
import { zodValidator } from '@tanstack/zod-adapter'
import { Select } from '@/components/Select'
import { z } from 'zod'
import {
  getSalesReport,
  SalesReportParams,
  type ProductPerformance,
  type InventoryInsights,
} from '@/lib/server/reports/sales'

const reportQueryOptions = (params: z.infer<typeof SalesReportParams>) =>
  queryOptions({
    queryKey: ['sales-report', params],
    queryFn: () => getSalesReport({ data: params }),
  })

export const Route = createFileRoute('/admin/reports/sales/')({
  component: RouteComponent,
  head: () => ({
    meta: [{ title: "Sales Report | Remi's Perfumes" }],
  }),
  loaderDeps: ({ search: { from, to, grouping } }) => ({ from, to, grouping }),
  loader: async ({ context, deps }) =>
    await context.queryClient.ensureQueryData(reportQueryOptions(deps)),
  validateSearch: zodValidator(SalesReportParams),
})

type MainTab =
  | 'sales'
  | 'profitability'
  | 'product_performance'
  | 'inventory_insights'
type ProfitMetric = 'profit' | 'margin' | 'cogs'

function RouteComponent() {
  const search = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  const reportQuery = useSuspenseQuery(reportQueryOptions(search))

  const reportData =
    reportQuery.data.status === 'SUCCESS' ? reportQuery.data.data : null
  const summary = reportData?.summary
  const chartData = reportData?.chartData || []

  const [datePreset, setDatePreset] = useState<string>('today')
  const [activeTab, setActiveTab] = useState<MainTab>('sales')
  const [profitMetric, setProfitMetric] = useState<ProfitMetric>('profit')

  const handleDatePresetChange = (preset: string) => {
    setDatePreset(preset)
    const now = new Date()
    let from: number | undefined
    let to: number | undefined

    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    ).getTime()
    const endOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
      999,
    ).getTime()

    if (preset === 'today') {
      from = startOfDay
      to = endOfDay
    } else if (preset === 'yesterday') {
      const yesterday = new Date(now)
      yesterday.setDate(now.getDate() - 1)
      from = new Date(
        yesterday.getFullYear(),
        yesterday.getMonth(),
        yesterday.getDate(),
      ).getTime()
      to = new Date(
        yesterday.getFullYear(),
        yesterday.getMonth(),
        yesterday.getDate(),
        23,
        59,
        59,
        999,
      ).getTime()
    } else if (preset === 'last_7_days') {
      const sevenDaysAgo = new Date(now)
      sevenDaysAgo.setDate(now.getDate() - 7)
      from = sevenDaysAgo.getTime()
      to = endOfDay
    } else if (preset === 'last_30_days') {
      const thirtyDaysAgo = new Date(now)
      thirtyDaysAgo.setDate(now.getDate() - 30)
      from = thirtyDaysAgo.getTime()
      to = endOfDay
    } else if (preset === 'this_month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).getTime()
      from = firstDay
      to = endOfDay
    } else if (preset === 'custom') {
      return
    }

    navigate({ search: (prev) => ({ ...prev, from, to }) })
  }

  const exportCSV = () => {
    if (!chartData.length) return

    const headers = [
      'Date',
      'Revenue',
      'Profit',
      'Transactions',
      'COGS',
      'Margin %',
    ]
    const rows = chartData.map((row) => {
      const cogs = row.revenue - row.profit
      const margin = row.revenue > 0 ? (row.profit / row.revenue) * 100 : 0
      return [
        row.date,
        row.revenue.toFixed(2),
        row.profit.toFixed(2),
        row.transactions,
        cogs.toFixed(2),
        margin.toFixed(2),
      ]
    })

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute(
      'download',
      `sales_report_${new Date().toISOString().split('T')[0]}.csv`,
    )
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getChartMetric = (item: (typeof chartData)[0]) => {
    if (activeTab === 'sales') {
      return item.revenue
    } else {
      switch (profitMetric) {
        case 'profit':
          return item.profit
        case 'margin':
          return item.revenue > 0 ? (item.profit / item.revenue) * 100 : 0
        case 'cogs':
          return item.revenue - item.profit
        default:
          return item.profit
      }
    }
  }

  const getChartLabel = () => {
    if (activeTab === 'sales') {
      return 'Revenue Trend'
    } else {
      switch (profitMetric) {
        case 'profit':
          return 'Gross Profit Trend'
        case 'margin':
          return 'Margin %'
        case 'cogs':
          return 'COGS'
        default:
          return 'Gross Profit Trend'
      }
    }
  }

  const chartValues = chartData.map(getChartMetric)
  const maxValue = Math.max(...chartValues, 1)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <Heading level={2}>Sales Report</Heading>
        <div className="flex gap-2">
          <Button
            variant="neutral"
            onClick={exportCSV}
            disabled={!chartData.length}
          >
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center bg-gray-50 p-4 rounded-lg">
        <div className="flex gap-2 items-center">
          <Select
            name="datePreset"
            value={datePreset}
            onChange={(e) => handleDatePresetChange(e.target.value)}
            className="w-40"
          >
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="last_7_days">Last 7 Days</option>
            <option value="last_30_days">Last 30 Days</option>
            <option value="this_month">This Month</option>
            <option value="custom">Custom Range</option>
          </Select>

          {datePreset === 'custom' && (
            <div className="flex gap-2 items-center">
              <input
                type="date"
                className="input input-bordered input-sm"
                value={
                  search.from
                    ? new Date(search.from).toISOString().split('T')[0]
                    : ''
                }
                onChange={(e) => {
                  const date = e.target.value
                    ? new Date(e.target.value).getTime()
                    : undefined
                  navigate({ search: (prev) => ({ ...prev, from: date }) })
                }}
              />
              <span className="text-gray-500">-</span>
              <input
                type="date"
                className="input input-bordered input-sm"
                value={
                  search.to
                    ? new Date(search.to).toISOString().split('T')[0]
                    : ''
                }
                onChange={(e) => {
                  const date = e.target.value
                    ? new Date(e.target.value).getTime()
                    : undefined
                  const time = date ? date + 86399999 : undefined
                  navigate({ search: (prev) => ({ ...prev, to: time }) })
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Main Tabs */}
      <div role="tablist" className="tabs tabs-boxed">
        <a
          role="tab"
          className={`tab ${activeTab === 'sales' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('sales')}
        >
          Sales Performance
        </a>
        <a
          role="tab"
          className={`tab ${activeTab === 'profitability' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('profitability')}
        >
          Profitability Analysis
        </a>
        <a
          role="tab"
          className={`tab ${activeTab === 'product_performance' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('product_performance')}
        >
          Product Performance
        </a>
        <a
          role="tab"
          className={`tab ${activeTab === 'inventory_insights' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('inventory_insights')}
        >
          Inventory Insights
        </a>
      </div>

      {activeTab === 'product_performance' && reportData?.productPerformance ? (
        <ProductPerformanceView data={reportData.productPerformance} />
      ) : activeTab === 'inventory_insights' &&
        reportData?.inventoryInsights ? (
        <InventoryInsightsView data={reportData.inventoryInsights} />
      ) : (
        <>
          {/* Summary Cards */}
          {summary && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeTab === 'sales' ? (
                <>
                  <SummaryCard
                    title="Total Revenue"
                    value={summary.totalRevenue.toFixed(2)}
                  />
                  <SummaryCard
                    title="Transactions"
                    value={summary.totalTransactions.toString()}
                  />
                  <SummaryCard
                    title="Avg Transaction"
                    value={summary.averageTransactionValue.toFixed(2)}
                  />
                </>
              ) : (
                <>
                  <SummaryCard
                    title="Gross Profit"
                    value={summary.grossProfit.toFixed(2)}
                  />
                  <SummaryCard
                    title="Margin"
                    value={`${summary.margin.toFixed(1)}%`}
                  />
                  <SummaryCard
                    title="Total COGS"
                    value={(summary.totalRevenue - summary.grossProfit).toFixed(
                      2,
                    )}
                  />
                </>
              )}
            </div>
          )}

          {/* Chart Section */}
          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">{getChartLabel()}</h3>
              {activeTab === 'profitability' && (
                <div className="join">
                  <button
                    className={`join-item btn btn-sm ${profitMetric === 'profit' ? 'btn-active' : ''}`}
                    onClick={() => setProfitMetric('profit')}
                  >
                    Profit
                  </button>
                  <button
                    className={`join-item btn btn-sm ${profitMetric === 'margin' ? 'btn-active' : ''}`}
                    onClick={() => setProfitMetric('margin')}
                  >
                    Margin
                  </button>
                  <button
                    className={`join-item btn btn-sm ${profitMetric === 'cogs' ? 'btn-active' : ''}`}
                    onClick={() => setProfitMetric('cogs')}
                  >
                    COGS
                  </button>
                </div>
              )}
            </div>

            {chartData.length > 0 ? (
              <div className="flex h-72">
                {/* Y-Axis */}
                <div className="flex flex-col justify-between text-xs text-gray-500 pr-2 py-2 h-full select-none min-w-[50px] text-right">
                  <span>{maxValue.toFixed(0)}</span>
                  <span>{(maxValue * 0.75).toFixed(0)}</span>
                  <span>{(maxValue * 0.5).toFixed(0)}</span>
                  <span>{(maxValue * 0.25).toFixed(0)}</span>
                  <span>0</span>
                </div>

                {/* Chart Area */}
                <div className="flex-1 overflow-x-auto relative">
                  {/* Grid Lines */}
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none py-2 z-0">
                    <div className="border-t border-gray-100 w-full h-0"></div>
                    <div className="border-t border-gray-100 w-full h-0"></div>
                    <div className="border-t border-gray-100 w-full h-0"></div>
                    <div className="border-t border-gray-100 w-full h-0"></div>
                    <div className="border-t border-gray-100 w-full h-0"></div>
                  </div>

                  <div className="flex items-end h-full min-w-full px-2 pt-12 pb-12 gap-4 z-10 relative">
                    {chartData.map((item) => {
                      const value = getChartMetric(item)
                      const heightPercent = (value / maxValue) * 100

                      return (
                        <div
                          key={item.date}
                          className="flex flex-col items-center gap-1 flex-1 min-w-[30px] group relative h-full justify-end"
                        >
                          <div
                            className={`w-full rounded-t transition-all ${activeTab === 'profitability' && profitMetric === 'profit' ? 'bg-green-500 hover:bg-green-600' : activeTab === 'profitability' && profitMetric === 'cogs' ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'}`}
                            style={{ height: `${Math.max(heightPercent, 1)}%` }}
                          ></div>

                          {/* X-Axis Label */}
                          <div className="absolute top-full mt-2 text-xs text-gray-500 whitespace-nowrap rotate-45 origin-top-left left-1/2">
                            {new Date(item.date).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </div>

                          {/* Tooltip */}
                          <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-800 text-white text-xs p-2 rounded z-20 whitespace-nowrap shadow-lg">
                            <div className="font-bold">
                              {new Date(item.date).toLocaleDateString(
                                undefined,
                                {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                },
                              )}
                            </div>
                            <div>
                              {getChartLabel()}: {value.toFixed(2)}
                              {activeTab === 'profitability' &&
                              profitMetric === 'margin'
                                ? '%'
                                : ''}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400">
                No data for selected period
              </div>
            )}
          </div>

          {/* Detailed Table */}
          <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold">Daily Breakdown</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    {activeTab === 'sales' ? (
                      <>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Transactions
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Revenue
                        </th>
                      </>
                    ) : (
                      <>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Revenue
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cost
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Profit
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Margin
                        </th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {chartData.map((row) => {
                    const cogs = row.revenue - row.profit
                    const margin =
                      row.revenue > 0 ? (row.profit / row.revenue) * 100 : 0
                    return (
                      <tr key={row.date} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {row.date}
                        </td>
                        {activeTab === 'sales' ? (
                          <>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {row.transactions}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {row.revenue.toFixed(2)}
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {row.revenue.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {cogs.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {row.profit.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {margin.toFixed(1)}%
                            </td>
                          </>
                        )}
                      </tr>
                    )
                  })}
                  {chartData.length === 0 && (
                    <tr>
                      <td
                        colSpan={activeTab === 'sales' ? 3 : 5}
                        className="px-6 py-4 text-center text-sm text-gray-500"
                      >
                        No data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function ProductPerformanceView({ data }: { data: ProductPerformance }) {
  const { bestSellers, categoryPerformance, variantPerformance } = data
  const maxCategoryRevenue = Math.max(
    ...categoryPerformance.map((c) => c.revenue),
    1,
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Best Sellers */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Best Sellers (Top 5)</h3>
          <div className="overflow-x-auto">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Product</th>
                  <th className="text-right">Sold</th>
                  <th className="text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {bestSellers.slice(0, 5).map((product) => (
                  <tr key={product.productId}>
                    <td>{product.productName}</td>
                    <td className="text-right">{product.quantity}</td>
                    <td className="text-right">{product.revenue.toFixed(2)}</td>
                  </tr>
                ))}
                {bestSellers.length === 0 && (
                  <tr>
                    <td colSpan={3} className="text-center text-gray-500">
                      No sales data
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Category Performance */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Category Performance</h3>
          <div className="flex flex-col gap-3">
            {categoryPerformance.map((cat) => (
              <div key={cat.categoryId} className="flex flex-col gap-1">
                <div className="flex justify-between text-sm">
                  <span>{cat.categoryName}</span>
                  <span className="font-medium">{cat.revenue.toFixed(2)}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full"
                    style={{
                      width: `${(cat.revenue / maxCategoryRevenue) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>
            ))}
            {categoryPerformance.length === 0 && (
              <div className="text-center text-gray-500">No category data</div>
            )}
          </div>
        </div>
      </div>

      {/* Detailed Variant Table */}
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Product Variant Details</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SKU
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Variant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity Sold
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {variantPerformance.map((variant) => (
                <tr key={variant.variantId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {variant.sku}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {variant.variantName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {variant.productName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {variant.quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {variant.revenue.toFixed(2)}
                  </td>
                </tr>
              ))}
              {variantPerformance.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-4 text-center text-sm text-gray-500"
                  >
                    No data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function InventoryInsightsView({ data }: { data: InventoryInsights }) {
  const { batchMovement, supplierPerformance, pricingAnalysis } = data

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Supplier Performance */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">
            Top Suppliers by Revenue
          </h3>
          <div className="overflow-x-auto">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Supplier</th>
                  <th className="text-right">Units Sold</th>
                  <th className="text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {supplierPerformance.slice(0, 5).map((supplier) => (
                  <tr key={supplier.supplierId}>
                    <td>{supplier.supplierName}</td>
                    <td className="text-right">{supplier.unitsSold}</td>
                    <td className="text-right">
                      {supplier.revenue.toFixed(2)}
                    </td>
                  </tr>
                ))}
                {supplierPerformance.length === 0 && (
                  <tr>
                    <td colSpan={3} className="text-center text-gray-500">
                      No supplier data
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pricing Analysis (Top Variance) */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">
            Pricing Analysis (Underpriced)
          </h3>
          <div className="overflow-x-auto">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Product</th>
                  <th className="text-right">Target</th>
                  <th className="text-right">Actual</th>
                  <th className="text-right">Var</th>
                </tr>
              </thead>
              <tbody>
                {pricingAnalysis.slice(0, 5).map((item) => (
                  <tr key={item.batchId}>
                    <td>
                      <div className="font-medium">{item.productName}</div>
                      <div className="text-xs text-gray-500">
                        {item.variantName}
                      </div>
                    </td>
                    <td className="text-right">
                      {item.targetSellPrice.toFixed(2)}
                    </td>
                    <td className="text-right">
                      {item.actualAvgSellPrice.toFixed(2)}
                    </td>
                    <td
                      className={`text-right font-bold ${item.variance < 0 ? 'text-red-500' : 'text-green-500'}`}
                    >
                      {item.variance.toFixed(2)}
                    </td>
                  </tr>
                ))}
                {pricingAnalysis.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center text-gray-500">
                      No pricing data
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Batch Movement Table */}
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Batch Movement</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Batch ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sold
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Remaining
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  COGS
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {batchMovement.map((batch) => (
                <tr key={batch.batchId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                    {batch.batchId.slice(0, 8)}...
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="font-medium">{batch.productName}</div>
                    <div className="text-xs text-gray-500">
                      {batch.variantName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {batch.quantitySold}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {batch.remainingStock}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {batch.costOfGoodsSold.toFixed(2)}
                  </td>
                </tr>
              ))}
              {batchMovement.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-4 text-center text-sm text-gray-500"
                  >
                    No batch data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function SummaryCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
      <div className="text-sm text-gray-500 uppercase tracking-wide font-semibold">
        {title}
      </div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  )
}
