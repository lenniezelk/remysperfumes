import {
  createFileRoute,
  useLocation,
  useNavigate,
} from '@tanstack/react-router'
import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader, Edit, Trash } from 'lucide-react'
import {
  useReactTable,
  getCoreRowModel,
  ColumnDef,
  flexRender,
} from '@tanstack/react-table'
import {
  listProductsPaginated,
  deleteProduct,
} from '@/lib/server/products/server-fns'
import Heading from '@/components/Heading'
import Button from '@/components/Button'
import AdminLayout from '@/components/dashboard/AdminLayout'
import ContainerNoOverflow from '@/components/ContainerNoOverflow'

export const Route = createFileRoute('/admin/products/')({
  component: ProductsPage,
})

function ProductsPage() {
  const [page, setPage] = useState(1)
  const location = useLocation()
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const { data, isLoading, error } = useQuery({
    queryKey: ['products', 'paginated', page],
    queryFn: () => listProductsPaginated({ data: { page, pageSize: 10 } }),
  })

  const mutation = useMutation({
    mutationFn: (id: string) => deleteProduct({ data: { id } }),
    onSuccess: () => {
      // Invalidate the products list
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === 'products',
      })
    },
  })

  const handleEdit = (id: string) => {
    navigate({ to: `/admin/products/product/${id}` })
  }

  const handleDelete = (id: string) => {
    mutation.mutate(id)
  }

  // Define columns
  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      { accessorKey: 'name', header: 'Name' },
      { accessorKey: 'description', header: 'Description' },
      { accessorKey: 'category_name', header: 'Category' },
      { accessorKey: 'brand', header: 'Brand' },
      { accessorKey: 'manufacturer_name', header: 'Manufacturer' },
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
    data: data?.data?.products || [],
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
            Products
          </Heading>
          <Button
            variant="primary"
            onClick={() => navigate({ to: '/admin/products/new' })}
          >
            Add New Product
          </Button>
        </div>
        {!data?.data || data?.data?.products.length == 0 ? (
          <Heading level={3}>No prodcuts found.</Heading>
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
                    data?.data?.products?.length ===
                    data?.data?.pagination?.pageSize
                      ? old + 1
                      : old,
                  )
                }
                disabled={
                  data?.data?.products?.length <
                  data?.data?.pagination?.pageSize
                }
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
