import {
  createFileRoute,
  useNavigate,
  useRouter,
} from '@tanstack/react-router'
import { useMemo, useRef, useState } from 'react'
import {
  useSuspenseQuery,
  queryOptions
} from '@tanstack/react-query'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import {
  deleteCategory,
  listCategoriesPaginated,
  restoreCategory,
} from '@/lib/server/categories/server-fns'
import Heading from '@/components/Heading'
import Button from '@/components/Button'
import {
  NotificationsList,
  useNotifications,
} from '@/components/notifications/Notification'
import { zodValidator } from '@tanstack/zod-adapter'
import { ListCategoriesParams } from '@/lib/server/categories/types'
import type { Category, PaginationInput } from '@/lib/server/categories/types'
import { SearchInput } from '@/components/SearchInput'
import { Select } from '@/components/Select'
import { debounce } from '@tanstack/pacer'
import AppLink from '@/components/AppLink'

const listQueryOptions = (params: PaginationInput) => queryOptions({
  queryKey: ['categories', params],
  queryFn: () => listCategoriesPaginated({ data: params }),
})

export const Route = createFileRoute('/admin/categories/')({
  component: CategoriesPage,
  validateSearch: zodValidator(ListCategoriesParams),
  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps }) => await context.queryClient.ensureQueryData(listQueryOptions(deps)),
})

const columnHelper = createColumnHelper<Category>()

function CategoriesPage() {
  const search = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  const [searchQuery, setSearchQuery] = useState(search.searchQuery)
  const router = useRouter()

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  )
  const notifications = useNotifications()
  const deleteDialogRef = useRef<HTMLDialogElement>(null)
  const restoreDialogRef = useRef<HTMLDialogElement>(null)
  const [deleting, setDeleting] = useState(false)
  const [restoring, setRestoring] = useState(false)

  const categoriesQuery = useSuspenseQuery(listQueryOptions(search))
  const data = categoriesQuery.data.success ? categoriesQuery.data.data : null

  const debouncedSearch = debounce((searchQuery: string) => {
    navigate({ search: (prev) => ({ ...prev, searchQuery, page: 1 }) })
  }, { wait: 500 })

  const handleDelete = (id: string) => {
    setSelectedCategoryId(id)
    deleteDialogRef.current?.showModal()
  }

  const handleRestore = (id: string) => {
    setSelectedCategoryId(id)
    restoreDialogRef.current?.showModal()
  }

  const confirmDelete = async () => {
    if (selectedCategoryId) {
      setDeleting(true)
      notifications.clear()
      try {
        const result = await deleteCategory({ data: { id: selectedCategoryId } })
        if (result.status === 'SUCCESS') {
          notifications.addNotification({
            message: 'Category deleted successfully',
            type: 'SUCCESS',
          })
          router.invalidate()
        } else {
          notifications.addNotification({
            message: result.error || 'Failed to delete category',
            type: 'ERROR',
          })
        }
      } catch (error) {
        notifications.addNotification({
          message: 'An error occurred while deleting the category',
          type: 'ERROR',
        })
      } finally {
        setDeleting(false)
        deleteDialogRef.current?.close()
      }
    }
  }

  const confirmRestore = async () => {
    if (selectedCategoryId) {
      setRestoring(true)
      notifications.clear()
      try {
        const result = await restoreCategory({ data: { id: selectedCategoryId } })
        if (result.status === 'SUCCESS') {
          notifications.addNotification({
            message: 'Category restored successfully',
            type: 'SUCCESS',
          })
          router.invalidate()
        } else {
          notifications.addNotification({
            message: result.error || 'Failed to restore category',
            type: 'ERROR',
          })
        }
      } catch (error) {
        notifications.addNotification({
          message: 'An error occurred while restoring the category',
          type: 'ERROR',
        })
      } finally {
        setRestoring(false)
        restoreDialogRef.current?.close()
      }
    }
  }

  // Define columns
  const columns = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: 'Name',
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor('description', {
        header: 'Description',
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor('created_at', {
        header: 'Created At',
        cell: (info) => new Date(info.getValue()).toLocaleString(),
      }),
      columnHelper.accessor('updated_at', {
        header: 'Updated At',
        cell: (info) => new Date(info.getValue()).toLocaleString(),
      }),
      columnHelper.display({
        id: 'edit',
        header: 'Edit',
        cell: (info) => (
          <AppLink
            to="/admin/categories/category/$id"
            params={{ id: info.row.original.id }}
            className="text-blue-600 hover:text-blue-800 hover:underline"
          >
            Edit
          </AppLink>
        ),
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        cell: (info) => {
          const isDeleted = !!info.row.original.deleted_at
          return isDeleted ? (
            <Button
              variant="primary"
              onClick={() => handleRestore(info.row.original.id)}
            >
              Restore
            </Button>
          ) : (
            <Button
              variant="error"
              onClick={() => handleDelete(info.row.original.id)}
            >
              Delete
            </Button>
          )
        },
      }),
    ],
    [],
  )

  const table = useReactTable({
    data: data?.categories || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="w-full overflow-x-auto">
      <NotificationsList />
      <div className="flex flex-wrap justify-between items-center mb-4 py-4 gap-4">
        <Heading level={4}>Categories</Heading>
        <div className="flex flex-wrap gap-4 items-center">
          <SearchInput
            name="searchQuery"
            placeholder="Search categories..."
            className="min-w-64"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); debouncedSearch(e.target.value) }}
          />
          <div className="flex gap-2 shrink-0">
            <div className="w-48">
              <Select
                name="sort"
                value={search.sort}
                onChange={(e) => navigate({ search: (prev) => ({ ...prev, sort: e.target.value as "name" | "created_at" }) })}
              >
                <option value="created_at">Sort by: Date Created</option>
                <option value="name">Sort by: Name</option>
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
                    showDeleted: false
                  }
                });
              }}
            >
              Clear Filters
            </Button>
            <Button
              variant="primary"
              onClick={() => navigate({ to: '/admin/categories/new' })}
            >
              Add New Category
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
          {(!data || data.categories.length === 0) ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                No categories found.
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className={row.original.deleted_at ? "bg-red-50" : ""}
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
              {data && (
                <div className="flex justify-end pr-4 mt-4">
                  <div className="flex items-center gap-3">
                    <AppLink
                      disabled={search.page <= 1}
                      from={Route.fullPath}
                      search={(prev: any) => ({ ...prev, page: Math.max((prev.page || 1) - 1, 1) })}
                    >Previous</AppLink>
                    <span className="text-sm text-gray-500">
                      Showing {((data.pagination.page - 1) * data.pagination.pageSize) + 1} to {Math.min(((data.pagination.page - 1) * data.pagination.pageSize) + data.categories.length, data.pagination.total)} of {data.pagination.total} categories
                    </span>
                    <AppLink
                      disabled={!data.pagination.hasNext}
                      from={Route.fullPath}
                      search={(prev: any) => ({ ...prev, page: (prev.page || 1) + 1 })}
                    >Next</AppLink>
                  </div>
                </div>
              )}
            </td>
          </tr>
        </tfoot>
      </table>

      <dialog id="confirmDelete" className="modal" ref={deleteDialogRef}>
        <div className="modal-box">
          <form method="dialog">
            <button disabled={deleting} className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
              ✕
            </button>
          </form>
          <p className="font-bold text-lg">
            Are you sure you want to delete this category?
          </p>
          <p className="text-sm text-gray-500 mt-2">This will soft delete the category. You can restore it later.</p>
          <div className="modal-action">
            <Button
              variant="neutral"
              disabled={deleting}
              onClick={() => {
                deleteDialogRef.current?.close()
              }}
            >
              Cancel
            </Button>
            <Button disabled={deleting} variant="error" onClick={confirmDelete}>
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>
      </dialog>

      <dialog id="confirmRestore" className="modal" ref={restoreDialogRef}>
        <div className="modal-box">
          <form method="dialog">
            <button disabled={restoring} className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
              ✕
            </button>
          </form>
          <p className="font-bold text-lg">
            Are you sure you want to restore this category?
          </p>
          <div className="modal-action">
            <Button
              variant="neutral"
              disabled={restoring}
              onClick={() => {
                restoreDialogRef.current?.close()
              }}
            >
              Cancel
            </Button>
            <Button disabled={restoring} variant="primary" onClick={confirmRestore}>
              {restoring ? "Restoring..." : "Restore"}
            </Button>
          </div>
        </div>
      </dialog>
    </div>
  )
}
