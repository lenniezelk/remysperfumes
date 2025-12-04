import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Edit, Loader, Trash } from 'lucide-react'
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import type { ColumnDef } from '@tanstack/react-table'
import {
  deleteCategory,
  listCategoriesPaginated,
} from '@/lib/server/categories/server-fns'
import Heading from '@/components/Heading'
import Button from '@/components/Button'
import {
  NotificationsList,
  useNotifications,
} from '@/components/notifications/Notification'

export const Route = createFileRoute('/admin/categories/')({
  component: CategoriesPage,
})

function CategoriesPage() {
  const [page, setPage] = useState(1)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  )
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { addNotification } = useNotifications()
  const deleteDialogRef = useRef<HTMLDialogElement>(null)

  const { data, isLoading, error } = useQuery({
    queryKey: ['categories', 'paginated', page],
    queryFn: () => listCategoriesPaginated({ data: { page, pageSize: 10 } }),
  })

  const mutation = useMutation({
    mutationFn: (id: string) => deleteCategory({ data: { id } }),
    onSuccess: (data) => {
      // Invalidate the categories list
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === 'categories',
      })

      if (data.status === 'SUCCESS') {
        addNotification({
          message: 'Category deleted successfully',
          type: 'SUCCESS',
        })
      } else {
        addNotification({
          message: data.error || 'Failed to delete category',
          type: 'ERROR',
        })
      }
    },
    onError: (error) => {
      addNotification({
        message:
          error.message || 'An error occurred while deleting the category',
        type: 'ERROR',
      })
    },
  })

  const handleEdit = (id: string) => {
    navigate({ to: `/admin/categories/category/${id}` })
  }

  const handleDelete = (id: string) => {
    setSelectedCategoryId(id)
    deleteDialogRef.current?.showModal()
  }

  const confirmDelete = () => {
    if (selectedCategoryId) {
      mutation.mutate(selectedCategoryId)
      deleteDialogRef.current?.close()
    }
  }

  // Define columns
  const columns = useMemo<Array<ColumnDef<any>>>(
    () => [
      { accessorKey: 'name', header: 'Name' },
      { accessorKey: 'description', header: 'Description' },
      {
        accessorKey: 'created_at',
        header: 'Created At',
        cell: (info) => new Date(info.getValue<number>()).toLocaleString(),
      },
      {
        accessorKey: 'updated_at',
        header: 'Updated At',
        cell: (info) => new Date(info.getValue<number>()).toLocaleString(),
      },
      {
        id: 'edit',
        header: '', // no header
        cell: ({ row }) => (
          <button
            onClick={() => handleEdit(row.original.id)}
            className="text-blue-500 hover:text-blue-700 cursor-pointer"
          >
            <Edit size={18} />
          </button>
        ),
      },
      {
        id: 'delete',
        header: '', // no header
        cell: ({ row }) => (
          <button
            onClick={() => handleDelete(row.original.id)}
            className="text-red-500 hover:text-red-700 cursor-pointer"
          >
            <Trash size={18} />
          </button>
        ),
      },
    ],
    [],
  )

  const table = useReactTable({
    data: data?.data?.categories || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  if (isLoading) return <Loader className="animate-spin w-8 h-8 text-brand" />

  if (error) return <div>Error: {error.message}</div>

  return (
    <div className="w-full overflow-x-auto">
      <NotificationsList />
      <div className="flex justify-between items-center mb-4">
        <Heading level={4}>Categories</Heading>
        <Button
          variant="primary"
          onClick={() => navigate({ to: '/admin/categories/new' })}
        >
          Add New Category
        </Button>
      </div>
      {!data?.data || data?.data?.categories.length == 0 ? (
        <Heading level={3}>No categories found.</Heading>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 rounded-md">
            <thead className="bg-gray-100">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-4 py-2 text-left font-medium text-gray-700 font-semibold"
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
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-t border-gray-200 hover:bg-gray-50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-2 text-gray-800">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination controls */}
          <div className="flex justify-end mt-4 space-x-2">
            <Button
              variant="primary"
              className="disabled:opacity-80"
              onClick={() => setPage((old) => Math.max(old - 1, 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <span className="px-4 py-2">Page {page}</span>
            <Button
              variant="primary"
              className="disabled:opacity-80"
              onClick={() =>
                setPage((old) =>
                  data?.data?.categories?.length ===
                  data?.data?.pagination?.pageSize
                    ? old + 1
                    : old,
                )
              }
              disabled={
                data?.data?.categories?.length <
                data?.data?.pagination?.pageSize
              }
            >
              Next
            </Button>
          </div>
        </div>
      )}
      <dialog id="confirmDelete" className="modal" ref={deleteDialogRef}>
        <div className="modal-box">
          <form method="dialog">
            <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
              ✕
            </button>
          </form>
          <p className="font-bold text-lg">
            Are you sure you want to delete this category?
          </p>
          <div className="modal-action">
            <Button
              variant="neutral"
              onClick={() => {
                deleteDialogRef.current?.close()
              }}
            >
              Cancel
            </Button>
            <Button variant="error" onClick={confirmDelete}>
              Delete
            </Button>
          </div>
        </div>
      </dialog>
    </div>
  )
}
