import {
  createFileRoute,
  useNavigate,
} from '@tanstack/react-router'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { useState } from 'react'
import type { UserWithPermissions } from '@/lib/types';
import { listUsers } from '@/lib/server/users/list'
import AppLink from '@/components/AppLink'
import Button from '@/components/Button'
import Heading from '@/components/Heading';

export const Route = createFileRoute('/admin/users/')({
  component: RouteComponent,
  loader: () => listUsers(),
})

const columnHelper = createColumnHelper<UserWithPermissions>()
const columns = [
  columnHelper.accessor('name', {
    header: 'Name',
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor('email', {
    header: 'Email',
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor('role', {
    header: 'Role',
    cell: (info) => info.getValue()?.name ?? 'No Role',
  }),
  columnHelper.accessor('is_active', {
    header: 'Active',
    cell: (info) => (info.getValue() ? 'Yes' : 'No'),
  }),
  columnHelper.accessor('deleted_at', {
    header: 'Deleted',
    cell: (info) =>
      info.getValue()
        ? `Yes on ${new Date(info.getValue()!).toLocaleDateString()}`
        : 'No',
  }),
  columnHelper.accessor('last_login_at', {
    header: 'Last Login',
    cell: (info) => info.getValue()?.toLocaleDateString() ?? 'Never',
  }),
  columnHelper.display({
    id: 'actions',
    header: 'Actions',
    cell: (info) => (
      <AppLink
        to="/admin/users/$userId"
        params={{ userId: info.row.original.id }}
        disabled={!info.row.original.canEditOrDelete}
      >
        Edit/Delete
      </AppLink>
    ),
  }),
]

function RouteComponent() {
  const initialData = Route.useLoaderData()
  const [data] = useState<Array<UserWithPermissions>>(() =>
    initialData.status === 'SUCCESS' ? initialData.data : [],
  )
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })
  const navigate = useNavigate()

  return (
    <div className="w-full overflow-x-auto">
      <div className="flex justify-between mb-4 items-center">
        <Heading level={4}>
          Users
        </Heading>
        <Button
          variant="primary"
          onClick={() => navigate({ to: '/admin/users/new' })}
        >
          Create New User
        </Button>
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
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td
                  key={cell.id}
                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
