import {
  createFileRoute,
  useLocation,
  Link,
  useNavigate,
} from '@tanstack/react-router'
import { useState, useMemo } from 'react'
import { listCategoriesPaginated } from '@/api/categories/server-fns'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader, Edit, Trash } from 'lucide-react'
import {
  useReactTable,
  getCoreRowModel,
  ColumnDef,
  flexRender,
} from '@tanstack/react-table'
import Heading from '@/components/Heading'
import AdminLayout from '@/components/dashboard/AdminLayout'
import ContainerNoOverflow from '@/components/ContainerNoOverflow'
import { deleteCategory } from '@/api/categories/server-fns'

export const Route = createFileRoute('/admin/categories')({
  component: CategoriesPage,
})

function CategoriesPage() {
  const [page, setPage] = useState(1)
  const location = useLocation()
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const { data, isLoading, error } = useQuery({
    queryKey: ['categories', 'paginated', page],
    queryFn: () => listCategoriesPaginated({ data: { page, pageSize: 10 } }),
  })

  const mutation = useMutation({
    mutationFn: (id: string) => deleteCategory({ data: { id } }),
    onSuccess: () => {
      console.log('Category deleted')
      // Invalidate the categories list
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === 'categories',
      })
    },
  })

  const handleEdit = (id: string) => {
    console.log('Edit category', id)
    navigate({ to: `/admin/category/${id}` })
  }

  const handleDelete = (id: string) => {
    console.log('Delete category', id)
    mutation.mutate(id)
  }

  // Define columns
  const columns = useMemo<ColumnDef<any>[]>(
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

  if (isLoading)
    return (
      <AdminLayout currentPath={location.pathname}>
        <ContainerNoOverflow>
          <Loader className="animate-spin w-8 h-8 text-brand" />
        </ContainerNoOverflow>
      </AdminLayout>
    )

  if (error)
    return (
      <AdminLayout currentPath={location.pathname}>
        <ContainerNoOverflow>
          <div>Error: {(error as Error).message}</div>
        </ContainerNoOverflow>
      </AdminLayout>
    )

  return (
    <AdminLayout currentPath={location.pathname}>
      <div className="p-6">
        <div className="flex justify-between">
          <Heading level={4} className="text-2xl font-bold mb-4 text-brand">
            Categories
          </Heading>
          <button className="bg-accent text-white px-6 py-3 rounded-full text-lg font-medium mb-8 shadow-lg">
            <Link to="/admin/create-category">Add New</Link>
          </button>
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
              <button
                className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
                onClick={() => setPage((old) => Math.max(old - 1, 1))}
                disabled={page === 1}
              >
                Previous
              </button>
              <span className="px-4 py-2">Page {page}</span>
              <button
                className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
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
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
