import {
  createFileRoute,
  useNavigate,
  useRouter,
} from '@tanstack/react-router'
import { useMemo, useRef, useState } from 'react'
import { useSuspenseQuery, queryOptions } from '@tanstack/react-query'
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import type {
  ColumnDef
} from '@tanstack/react-table';
import {
  deleteProduct,
  listProductsPaginated,
  restoreProduct,
} from '@/lib/server/products/server-fns'
import { getAllCategories } from '@/lib/server/categories/server-fns'
import Heading from '@/components/Heading'
import Button from '@/components/Button'
import AppLink from '@/components/AppLink'
import { debounce } from '@tanstack/pacer'
import { NotificationsList, useNotifications } from '@/components/notifications/Notification'
import { SearchInput } from '@/components/SearchInput'
import { Select } from '@/components/Select'
import { zodValidator } from '@tanstack/zod-adapter'
import { ListProductsParams } from '@/lib/server/products/types'
import type { PaginationInput } from '@/lib/server/products/types'
import { listManufacturers } from '@/lib/server/manufacturer/list';


const listQueryOptions = (params: PaginationInput) => queryOptions({
  queryKey: ['products', params],
  queryFn: () => listProductsPaginated({ data: params }),
})

const categoriesQueryOptions = queryOptions({
  queryKey: ['categories'],
  queryFn: () => getAllCategories(),
})

const manufacturersQueryOptions = queryOptions({
  queryKey: ['manufacturers'],
  queryFn: () => listManufacturers(),
})

export const Route = createFileRoute('/admin/products/')({
  component: ProductsPage,
  loaderDeps: ({ search: { searchQuery, sort, order, page, limit, showDeleted, category_id, manufacturer_id } }) => ({ searchQuery, sort, order, page, limit, showDeleted, category_id, manufacturer_id }),
  loader: async ({ context, deps: { searchQuery, sort, order, page, limit, showDeleted, category_id, manufacturer_id } }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(listQueryOptions({ searchQuery, sort, order, page, limit, showDeleted, category_id, manufacturer_id })),
      context.queryClient.ensureQueryData(categoriesQueryOptions),
      context.queryClient.ensureQueryData(manufacturersQueryOptions),
    ])
  },
  validateSearch: zodValidator(ListProductsParams),
  head: () => ({
    meta: [
      { title: "Products | Remi's Perfumes" },
    ]
  }),
})

function ProductsPage() {
  const search = Route.useSearch()

  const navigate = useNavigate({ from: Route.fullPath })
  const [searchQuery, setSearchQuery] = useState(search.searchQuery)
  const notifications = useNotifications()
  const deleteDialogRef = useRef<HTMLDialogElement>(null)
  const restoreDialogRef = useRef<HTMLDialogElement>(null)
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const router = useRouter()

  const productsQuery = useSuspenseQuery(listQueryOptions(search))
  const data = productsQuery.data.success ? productsQuery.data.data : null

  const debouncedSearch = debounce((searchQuery: string) => {
    navigate({ search: (prev) => ({ ...prev, searchQuery, page: 1 }) })
  }, { wait: 500 })

  const handleDelete = (id: string) => {
    setSelectedProductId(id)
    deleteDialogRef.current?.showModal()
  }

  const handleRestore = (id: string) => {
    setSelectedProductId(id)
    restoreDialogRef.current?.showModal()
  }

  const deleteProductById = async (id: string) => {
    setDeleting(true)
    notifications.clear()
    deleteProduct({ data: { id } }).then((result) => {
      if (result.success) {
        notifications.addNotification({
          message: 'Product deleted successfully.',
          type: 'SUCCESS',
        })
        router.invalidate()
      } else {
        notifications.addNotification({
          message: result.message || 'An error occurred while deleting the product.',
          type: 'ERROR',
        })
      }
    }).catch((error) => {
      notifications.addNotification({
        message: error.message || 'An unexpected error occurred.',
        type: 'ERROR',
      })
    }).finally(() => {
      deleteDialogRef.current?.close()
      setDeleting(false)
    })
  }

  const restoreProductById = async (id: string) => {
    setRestoring(true)
    notifications.clear()
    restoreProduct({ data: { id } }).then((result) => {
      if (result.success) {
        notifications.addNotification({
          message: 'Product restored successfully.',
          type: 'SUCCESS',
        })
        router.invalidate()
      } else {
        notifications.addNotification({
          message: result.message || 'An error occurred while restoring the product.',
          type: 'ERROR',
        })
      }
    }).catch((error) => {
      notifications.addNotification({
        message: error.message || 'An unexpected error occurred.',
        type: 'ERROR',
      })
    }).finally(() => {
      restoreDialogRef.current?.close()
      setRestoring(false)
    })
  }

  // Define columns
  const columns = useMemo<Array<ColumnDef<any>>>(
    () => [
      { accessorKey: 'name', header: 'Name' },
      { accessorKey: 'category_name', header: 'Category' },
      { accessorKey: 'brand', header: 'Brand' },
      { accessorKey: 'manufacturer_name', header: 'Manufacturer' },
      { accessorKey: 'default_sell_price', header: 'Default Sell Price' },
      // {
      //   accessorKey: 'updated_at',
      //   header: 'Updated At',
      //   cell: (info) => new Date(info.getValue<number>()).toLocaleString(),
      // },
      {
        id: 'edit',
        header: 'Edit', // no header
        cell: ({ row }) => (
          <AppLink
            to={`/admin/products/$productId`}
            params={{ productId: row.original.id }}
          >
            Edit
          </AppLink>
        ),
      },
      {
        id: 'delete',
        header: 'Delete/Restore',
        cell: ({ row }) => {
          const isDeleted = !!row.original.deleted_at
          return isDeleted ? (
            <Button
              onClick={() => handleRestore(row.original.id)}
              variant="primary"
            >
              Restore
            </Button>
          ) : (
            <Button
              variant="error"
              onClick={() => handleDelete(row.original.id)}
            >
              Delete
            </Button>
          )
        },
      },
    ],
    [],
  )

  const table = useReactTable({
    data: data?.products || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  const categoriesQuery = useSuspenseQuery(categoriesQueryOptions)
  const manufacturersQuery = useSuspenseQuery(manufacturersQueryOptions)
  const categories = categoriesQuery.data.success ? categoriesQuery.data.data : []
  const manufacturers = manufacturersQuery.data.status === 'SUCCESS' ? manufacturersQuery.data.data : []

  return (
    <div className="w-full overflow-x-auto">
      <NotificationsList />
      <div className="flex flex-wrap justify-between items-center mb-4 py-4 gap-4">
        <Heading level={4}>
          Products
        </Heading>
        <div className="flex flex-wrap gap-4 items-center">
          <SearchInput
            name="searchQuery"
            placeholder="Search products..."
            className="min-w-64"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); debouncedSearch(e.target.value) }}
          />
          <div className="flex gap-2 shrink-0">
            <div className="w-48">
              <Select
                name="sort"
                value={search.sort}
                onChange={(e) => navigate({ search: (prev) => ({ ...prev, sort: e.target.value as "name" | "created_at" | "default_sell_price" }) })}
              >
                <option value="created_at">Sort by: Date Created</option>
                <option value="name">Sort by: Name</option>
                <option value="default_sell_price">Sort by: Price</option>
              </Select>
            </div>
            <div className="w-36">
              <Select
                name="order"
                value={search.order}
                onChange={(e) => navigate({ search: (prev) => ({ ...prev, order: e.target.value as "asc" | "desc" }) })}
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </Select>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <div className="w-48">
              <Select
                name="category"
                value={search.category_id || ""}
                onChange={(e) => navigate({ search: (prev) => ({ ...prev, category_id: e.target.value || undefined, page: 1 }) })}
              >
                <option value="">All Categories</option>
                {categories?.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="w-48">
              <Select
                name="manufacturer"
                value={search.manufacturer_id || ""}
                onChange={(e) => navigate({ search: (prev) => ({ ...prev, manufacturer_id: e.target.value || undefined, page: 1 }) })}
              >
                <option value="">All Manufacturers</option>
                {manufacturers?.map((manufacturer) => (
                  <option key={manufacturer.id} value={manufacturer.id}>
                    {manufacturer.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div className="w-36 shrink-0">
            <Select
              name="limit"
              value={search.limit.toString()}
              onChange={(e) => navigate({ search: (prev) => ({ ...prev, limit: parseInt(e.target.value), page: 1 }) })}
            >
              <option value="10">10 per page</option>
              <option value="25">25 per page</option>
              <option value="50">50 per page</option>
              <option value="100">100 per page</option>
            </Select>
          </div>
          <div className="flex gap-2 shrink-0 flex-wrap">
            <Button
              variant={search.showDeleted ? "primary" : "neutral"}
              onClick={() => navigate({ search: (prev) => ({ ...prev, showDeleted: !prev.showDeleted, page: 1 }) })}
            >
              {search.showDeleted ? "Hide Deleted" : "Show Deleted"}
            </Button>
            <Button
              variant="neutral"
              onClick={() => {
                setSearchQuery("");
                navigate({
                  search: {
                    searchQuery: "",
                    sort: "created_at",
                    order: "desc",
                    page: 1,
                    limit: 10,
                    showDeleted: false,
                    category_id: undefined,
                    manufacturer_id: undefined
                  }
                });
              }}
            >
              Clear Filters
            </Button>
            <Button
              variant="primary"
              onClick={() => navigate({ to: '/admin/products/new' })}
            >
              Add New Product
            </Button>
          </div>
        </div>
      </div>
      {!data || data.products.length == 0 ? (
        <Heading level={3}>No products found.</Heading>
      ) : (
        <div className="w-full overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className={row.original.deleted_at ? "bg-red-50" : ""}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={table.getAllColumns().length} className="h-10">
                  <div className="flex justify-end pr-4 mt-4">
                    <div className="flex items-center gap-3">
                      <AppLink
                        disabled={search.page <= 1}
                        from={Route.fullPath}
                        search={(prev) => ({ ...prev, page: Math.max((prev.page || 1) - 1, 1) })}
                      >Previous</AppLink>
                      <span className="text-sm text-gray-500">
                        Showing {((data.pagination.page - 1) * data.pagination.pageSize) + 1} to {((data.pagination.page - 1) * data.pagination.pageSize) + data.products.length} of {data.pagination.total} products
                      </span>
                      <AppLink
                        disabled={!data.pagination.hasNext}
                        from={Route.fullPath}
                        search={(prev) => ({ ...prev, page: (prev.page || 1) + 1 })}
                      >Next</AppLink>
                    </div>
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <dialog id="confirmDelete" className="modal" ref={deleteDialogRef}>
        <div className="modal-box">
          <form method="dialog">
            <button disabled={deleting} className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
          </form>
          <p className="font-bold text-lg">Are you sure you want to delete this product?</p>
          <p className="text-sm text-gray-500 mt-2">This will soft delete the product. You can restore it later.</p>
          <div className="modal-action">
            <Button disabled={deleting} variant="neutral" onClick={() => {
              deleteDialogRef.current?.close();
            }}>Cancel</Button>
            <div>
              <Button
                disabled={deleting}
                variant="error"
                onClick={() => {
                  if (selectedProductId) {
                    deleteProductById(selectedProductId);
                  }
                }}
              >
                {deleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      </dialog>

      {/* Restore Confirmation Dialog */}
      <dialog id="confirmRestore" className="modal" ref={restoreDialogRef}>
        <div className="modal-box">
          <form method="dialog">
            <button disabled={restoring} className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
          </form>
          <p className="font-bold text-lg">Are you sure you want to restore this product?</p>
          <p className="text-sm text-gray-500 mt-2">This will restore the product to the active list.</p>
          <div className="modal-action">
            <Button disabled={restoring} variant="neutral" onClick={() => {
              restoreDialogRef.current?.close();
            }}>Cancel</Button>
            <div>
              <Button
                disabled={restoring}
                variant="primary"
                onClick={() => {
                  if (selectedProductId) {
                    restoreProductById(selectedProductId);
                  }
                }}
              >
                {restoring ? "Restoring..." : "Restore"}
              </Button>
            </div>
          </div>
        </div>
      </dialog>
    </div>
  )
}
