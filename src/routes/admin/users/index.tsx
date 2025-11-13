import { listUsers } from '@/lib/users/users'
import { createFileRoute } from '@tanstack/react-router'
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { type User } from '@/lib/types';
import { useState } from 'react';
import AppLink from '@/components/AppLink';

export const Route = createFileRoute('/admin/users/')({
    component: RouteComponent,
    loader: () => listUsers(),
})

const columnHelper = createColumnHelper<User>();
const columns = [
    columnHelper.accessor('name', {
        header: 'Name',
        cell: info => info.getValue(),
    }),
    columnHelper.accessor('email', {
        header: 'Email',
        cell: info => info.getValue(),
    }),
    columnHelper.accessor('role', {
        header: 'Role',
        cell: info => info.getValue()?.name ?? 'No Role',
    }),
    columnHelper.accessor('is_active', {
        header: 'Active',
        cell: info => info.getValue() ? 'Yes' : 'No',
    }),
    columnHelper.accessor('last_login_at', {
        header: 'Last Login',
        cell: info => info.getValue()?.toLocaleDateString() ?? 'Never',
    }),
    columnHelper.display({
        id: 'actions',
        header: 'Actions',
        cell: info => (
            <AppLink
                to="/admin/users/$userId"
                params={{ userId: info.row.original.id }}
            >
                Edit
            </AppLink>
        ),
    }),
];

function RouteComponent() {
    const initialData = Route.useLoaderData()
    const [data, setData] = useState<User[]>(() => initialData.status === 'SUCCESS' ? initialData.data : []);
    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
    })

    return (
        <div className='w-full overflow-x-auto'>
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    {table.getHeaderGroups().map(headerGroup => (
                        <tr key={headerGroup.id}>
                            {headerGroup.headers.map(header => (
                                <th
                                    key={header.id}
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    {header.isPlaceholder ? null : flexRender(
                                        header.column.columnDef.header,
                                        header.getContext()
                                    )}
                                </th>
                            ))}
                        </tr>
                    ))}
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {table.getRowModel().rows.map(row => (
                        <tr key={row.id}>
                            {row.getVisibleCells().map(cell => (
                                <td
                                    key={cell.id}
                                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                                >
                                    {flexRender(
                                        cell.column.columnDef.cell,
                                        cell.getContext()
                                    )}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
