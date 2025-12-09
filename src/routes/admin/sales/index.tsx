import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { useRef, useState } from 'react'
import type { Sale } from '@/lib/types/sales'
import AppLink from '@/components/AppLink'
import Button from '@/components/Button'
import {
  useNotifications,
  NotificationsList,
} from '@/components/notifications/Notification'
import { deleteSale, restoreSale } from '@/lib/server/sales/delete'
import { listSales, ListSalesParams } from '@/lib/server/sales/list'
import { updateSale } from '@/lib/server/sales/update'
import Heading from '@/components/Heading'
import { queryOptions, useSuspenseQuery } from '@tanstack/react-query'
import { zodValidator } from '@tanstack/zod-adapter'
import { z } from 'zod'
import { debounce } from '@tanstack/pacer'
import { SearchInput } from '@/components/SearchInput'
import { Select } from '@/components/Select'

type ListQueryOptions = z.infer<typeof ListSalesParams>

const listQueryOptions = (params: ListQueryOptions) =>
  queryOptions({
    queryKey: ['sales', params],
    queryFn: () => listSales({ data: params }),
  })

export const Route = createFileRoute('/admin/sales/')({
  component: RouteComponent,
  head: () => ({
    meta: [{ title: "Sales | Remi's Perfumes" }],
  }),
  loaderDeps: ({
    search: { searchQuery, sort, order, page, limit, showDeleted, from, to },
  }) => ({ searchQuery, sort, order, page, limit, showDeleted, from, to }),
  loader: async ({ context, deps }) =>
    await context.queryClient.ensureQueryData(listQueryOptions(deps)),
  validateSearch: zodValidator(ListSalesParams),
})

const columnHelper = createColumnHelper<Sale>()

function getColumns(
  onOpenDeleteDialog: (saleId: string) => void,
  onOpenRestoreDialog: (saleId: string) => void,
) {
  return [
    columnHelper.accessor('date', {
      header: 'Date',
      cell: (info) => new Date(info.getValue()).toLocaleDateString(),
    }),
    columnHelper.accessor('customer_name', {
      header: 'Customer Name',
      cell: (info) => info.getValue() || '-',
    }),
    columnHelper.accessor('customer_contact', {
      header: 'Customer Contact',
      cell: (info) => info.getValue() || '-',
    }),
    columnHelper.accessor('total_amount', {
      header: 'Total Amount',
      cell: (info) => `${(info.getValue() || 0).toFixed(2)}`,
    }),
    columnHelper.display({
      id: 'edit',
      header: 'Edit',
      cell: (info) => (
        <AppLink
          to="/admin/sales/$saleId"
          params={{ saleId: info.row.original.id }}
          className="text-blue-600 hover:underline"
        >
          Edit
        </AppLink>
      ),
    }),
    columnHelper.display({
      id: 'delete',
      header: 'Delete',
      cell: (info) => {
        const isDeleted = !!info.row.original.deleted_at
        return (
          <Button
            variant={isDeleted ? 'primary' : 'error'}
            onClick={() => onOpenDeleteDialog(info.row.original.id)}
          >
            {isDeleted ? 'Restore' : 'Delete'}
          </Button>
        )
      },
    }),
  ]
}

function RouteComponent() {
  const search = Route.useSearch()
  const salesQuery = useSuspenseQuery(listQueryOptions(search))
  const data =
    salesQuery.data.status === 'SUCCESS' ? salesQuery.data.data.items : []
  const total =
    salesQuery.data.status === 'SUCCESS' ? salesQuery.data.data.total : 0
  const totalAmount =
    salesQuery.data.status === 'SUCCESS'
      ? (salesQuery.data.data as any).totalAmount
      : 0 // Cast to any because type inference might lag without strict generic updates
  const page =
    salesQuery.data.status === 'SUCCESS' ? salesQuery.data.data.page : 1
  const limit =
    salesQuery.data.status === 'SUCCESS' ? salesQuery.data.data.limit : 10
  const offset =
    salesQuery.data.status === 'SUCCESS' ? salesQuery.data.data.offset : 0

  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null)
  const navigate = useNavigate({ from: Route.fullPath })
  const notifications = useNotifications()
  const deleteDialogRef = useRef<HTMLDialogElement>(null)
  const restoreDialogRef = useRef<HTMLDialogElement>(null)
  const [deleting, setDeleting] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState(search.searchQuery)
  const [datePreset, setDatePreset] = useState<string>('all_time')

  const debouncedSearch = debounce(
    (searchQuery: string) => {
      navigate({ search: (prev) => ({ ...prev, searchQuery, page: 1 }) })
    },
    { wait: 500 },
  )

  const handleDatePresetChange = (preset: string) => {
    setDatePreset(preset)
    const now = new Date()
    let from: number | undefined
    let to: number | undefined

    // Reset time to start of day for accurate comparison
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
    } else if (preset === 'this_week') {
      // Get monday of current week
      const day = now.getDay()
      const diff = now.getDate() - day + (day === 0 ? -6 : 1) // adjust when day is sunday
      const monday = new Date(now.setDate(diff))
      from = new Date(
        monday.getFullYear(),
        monday.getMonth(),
        monday.getDate(),
      ).getTime()
      to = endOfDay
    } else if (preset === 'last_30_days') {
      const thirtyDaysAgo = new Date(now)
      thirtyDaysAgo.setDate(now.getDate() - 30)
      from = thirtyDaysAgo.getTime()
      to = endOfDay
    } else if (preset === 'custom') {
      // Keep existing values or don't set
      return
    } else {
      // All time
      from = undefined
      to = undefined
    }

    navigate({ search: (prev) => ({ ...prev, from, to, page: 1 }) })
  }

  const deleteOrRestoreSale = async (saleId: string) => {
    const sale = data.find((s) => s.id === saleId)
    if (!sale) return

    const isDeleted = !!sale.deleted_at
    setDeleting(true)
    notifications.clear()

    if (isDeleted) {
      // Restore the sale
      updateSale({
        data: {
          saleId,
          date: new Date(sale.date),
          total_amount: sale.total_amount || 0,
          customer_name: sale.customer_name || '',
          customer_contact: sale.customer_contact || '',
          restore_sale: true,
        },
      })
        .then((result) => {
          if (result.status === 'SUCCESS') {
            notifications.addNotification({
              message: 'Sale restored successfully.',
              type: 'SUCCESS',
            })
            router.invalidate()
          } else {
            notifications.addNotification({
              message:
                result.error || 'An error occurred while restoring the sale.',
              type: 'ERROR',
            })
          }
        })
        .catch((error) => {
          notifications.addNotification({
            message: error.message || 'An unexpected error occurred.',
            type: 'ERROR',
          })
        })
        .finally(() => {
          deleteDialogRef.current?.close()
          setDeleting(false)
        })
    } else {
      // Delete the sale
      deleteSale({ data: { saleId } })
        .then((result) => {
          if (result.status === 'SUCCESS') {
            notifications.addNotification({
              message: 'Sale deleted successfully.',
              type: 'SUCCESS',
            })
            router.invalidate()
          } else {
            notifications.addNotification({
              message:
                result.error || 'An error occurred while deleting the sale.',
              type: 'ERROR',
            })
          }
        })
        .catch((error) => {
          notifications.addNotification({
            message: error.message || 'An unexpected error occurred.',
            type: 'ERROR',
          })
        })
        .finally(() => {
          deleteDialogRef.current?.close()
          setDeleting(false)
        })
    }
  }

  const restoreSaleById = async (saleId: string) => {
    setRestoring(true)
    notifications.clear()
    restoreSale({ data: { saleId } })
      .then((result) => {
        if (result.status === 'SUCCESS') {
          notifications.addNotification({
            message: 'Sale restored successfully.',
            type: 'SUCCESS',
          })
          router.invalidate()
        } else {
          notifications.addNotification({
            message:
              result.error || 'An error occurred while restoring the sale.',
            type: 'ERROR',
          })
        }
      })
      .catch((error) => {
        notifications.addNotification({
          message: error.message || 'An unexpected error occurred.',
          type: 'ERROR',
        })
      })
      .finally(() => {
        restoreDialogRef.current?.close()
        setRestoring(false)
      })
  }

  const openDeleteDialog = (saleId: string) => {
    setSelectedSaleId(saleId)
    deleteDialogRef.current?.showModal()
  }

  const openRestoreDialog = (saleId: string) => {
    setSelectedSaleId(saleId)
    restoreDialogRef.current?.showModal()
  }

  const columns = getColumns(openDeleteDialog, openRestoreDialog)
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="w-full overflow-x-auto">
      <NotificationsList />
      <div className="flex flex-col mb-4 gap-4">
        <div className="flex justify-between items-center">
          <Heading level={4}>Sales</Heading>
          <Button
            variant="primary"
            onClick={() => navigate({ to: '/admin/sales/new' })}
          >
            Create New Sale
          </Button>
        </div>
        <div className="flex flex-wrap gap-4 items-center bg-gray-50 p-4 rounded-lg">
          <SearchInput
            name="searchQuery"
            placeholder="Search sales..."
            className="min-w-64"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              debouncedSearch(e.target.value)
            }}
          />

          <div className="flex gap-2 items-center">
            <Select
              name="datePreset"
              value={datePreset}
              onChange={(e) => handleDatePresetChange(e.target.value)}
              className="w-40"
            >
              <option value="all_time">All Time</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="this_week">This Week</option>
              <option value="last_30_days">Last 30 Days</option>
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
                    navigate({
                      search: (prev) => ({ ...prev, from: date, page: 1 }),
                    })
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
                    // Set to end of day if selecting a specific date
                    const time = date ? date + 86399999 : undefined
                    navigate({
                      search: (prev) => ({ ...prev, to: time, page: 1 }),
                    })
                  }}
                />
              </div>
            )}
          </div>

          <div className="flex gap-2 shrink-0">
            <div className="w-48">
              <Select
                name="sort"
                value={search.sort}
                onChange={(e) =>
                  navigate({
                    search: (prev) => ({
                      ...prev,
                      sort: e.target.value as
                        | 'date'
                        | 'total_amount'
                        | 'customer_name',
                    }),
                  })
                }
              >
                <option value="date">Sort by: Date</option>
                <option value="total_amount">Sort by: Amount</option>
                <option value="customer_name">Sort by: Customer</option>
              </Select>
            </div>
            <div className="w-36">
              <Select
                name="order"
                value={search.order}
                onChange={(e) =>
                  navigate({
                    search: (prev) => ({
                      ...prev,
                      order: e.target.value as 'asc' | 'desc',
                    }),
                  })
                }
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </Select>
            </div>
          </div>
          <div className="w-36 shrink-0">
            <Select
              name="limit"
              value={search.limit.toString()}
              onChange={(e) =>
                navigate({
                  search: (prev) => ({
                    ...prev,
                    limit: parseInt(e.target.value),
                    page: 1,
                  }),
                })
              }
            >
              <option value="10">10 per page</option>
              <option value="25">25 per page</option>
              <option value="50">50 per page</option>
              <option value="100">100 per page</option>
            </Select>
          </div>
          <div className="flex gap-2 shrink-0 flex-wrap">
            <Button
              variant={search.showDeleted ? 'primary' : 'neutral'}
              onClick={() =>
                navigate({
                  search: (prev) => ({
                    ...prev,
                    showDeleted: !prev.showDeleted,
                    page: 1,
                  }),
                })
              }
            >
              {search.showDeleted ? 'Hide Deleted' : 'Show Deleted'}
            </Button>
            <Button
              variant="neutral"
              onClick={() => {
                setSearchQuery('')
                setDatePreset('all_time')
                navigate({
                  search: {
                    searchQuery: '',
                    sort: 'date',
                    order: 'desc',
                    page: 1,
                    limit: 10,
                    showDeleted: false,
                    from: undefined,
                    to: undefined,
                  },
                })
              }}
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </div>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {!data || data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center"
              >
                No sales found.
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className={row.original.deleted_at ? 'bg-red-50' : ''}
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={table.getAllColumns().length} className="h-10">
              <div className="flex justify-between items-center px-4 mt-4">
                <div className="font-bold text-lg">
                  Total Value: {totalAmount.toFixed(2)}
                </div>
                <div className="flex items-center gap-3">
                  <AppLink
                    disabled={page <= 1}
                    from={Route.fullPath}
                    search={(prev) => ({
                      ...prev,
                      page: Math.max((prev.page || 1) - 1, 1),
                    })}
                  >
                    Previous
                  </AppLink>
                  <span className="text-sm text-gray-500">
                    Showing {offset + 1} to {offset + data.length} of {total}{' '}
                    sales
                  </span>
                  <AppLink
                    disabled={offset + limit >= total}
                    from={Route.fullPath}
                    search={(prev) => ({ ...prev, page: (prev.page || 1) + 1 })}
                  >
                    Next
                  </AppLink>
                </div>
              </div>
            </td>
          </tr>
        </tfoot>
      </table>

      {/* Delete Confirmation Dialog */}
      <dialog id="confirmDelete" className="modal" ref={deleteDialogRef}>
        <div className="modal-box">
          <form method="dialog">
            <button
              disabled={deleting}
              className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
            >
              ✕
            </button>
          </form>
          <p className="font-bold text-lg">
            {selectedSaleId &&
            data.find((s) => s.id === selectedSaleId)?.deleted_at
              ? 'Are you sure you want to restore this sale?'
              : 'Are you sure you want to delete this sale?'}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            This will soft delete the sale. You can restore it later.
          </p>
          <div className="modal-action">
            <Button
              disabled={deleting}
              variant="neutral"
              onClick={() => {
                deleteDialogRef.current?.close()
              }}
            >
              Cancel
            </Button>
            <div>
              <Button
                disabled={deleting}
                variant={
                  selectedSaleId &&
                  data.find((s) => s.id === selectedSaleId)?.deleted_at
                    ? 'primary'
                    : 'error'
                }
                onClick={() => {
                  if (selectedSaleId) {
                    deleteOrRestoreSale(selectedSaleId)
                  }
                }}
              >
                {deleting
                  ? selectedSaleId &&
                    data.find((s) => s.id === selectedSaleId)?.deleted_at
                    ? 'Restoring...'
                    : 'Deleting...'
                  : selectedSaleId &&
                      data.find((s) => s.id === selectedSaleId)?.deleted_at
                    ? 'Restore'
                    : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      </dialog>

      {/* Restore Confirmation Dialog */}
      <dialog id="confirmRestore" className="modal" ref={restoreDialogRef}>
        <div className="modal-box">
          <form method="dialog">
            <button
              disabled={restoring}
              className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
            >
              ✕
            </button>
          </form>
          <p className="font-bold text-lg">
            Are you sure you want to restore this sale?
          </p>
          <div className="modal-action">
            <Button
              disabled={restoring}
              variant="neutral"
              onClick={() => {
                restoreDialogRef.current?.close()
              }}
            >
              Cancel
            </Button>
            <div>
              <Button
                disabled={restoring}
                variant="primary"
                onClick={() => {
                  if (selectedSaleId) {
                    restoreSaleById(selectedSaleId)
                  }
                }}
              >
                {restoring ? 'Restoring...' : 'Restore'}
              </Button>
            </div>
          </div>
        </div>
      </dialog>
    </div>
  )
}
