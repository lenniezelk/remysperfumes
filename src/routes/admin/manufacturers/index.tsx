import AppLink from '@/components/AppLink';
import Button from '@/components/Button';
import { listManufacturers } from '@/lib/server/manufacturer/list'
import { Manufacturer } from '@/lib/types';
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { useState } from 'react';

export const Route = createFileRoute('/admin/manufacturers/')({
    component: RouteComponent,
    loader: () => listManufacturers(),
})

const columnHelper = createColumnHelper<Manufacturer>();
const columns = [
    columnHelper.accessor('name', {
        header: 'Name',
        cell: info => info.getValue(),
    }),
    columnHelper.accessor('contact_info', {
        header: 'Contact Info',
        cell: info => info.getValue(),
    }),
    columnHelper.display({
        id: 'actions',
        header: 'Actions',
        cell: info => (
            <AppLink
                to="/admin/manufacturers/$manufacturerId"
                params={{ manufacturerId: info.row.original.id }}
            >
                Edit/Delete
            </AppLink>
        ),
    }),
];

function RouteComponent() {
    const initialData = Route.useLoaderData()
    const [data] = useState<Manufacturer[]>(() => initialData.status === 'SUCCESS' ? initialData.data : []);
    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
    })
    const navigate = useNavigate();

    return (
        <div className='w-full overflow-x-auto'>
            <div className="flex justify-end mb-4">
                <Button variant="primary" onClick={() => navigate({ to: '/admin/manufacturers/new' })}>
                    Create New Manufacturer
                </Button>
            </div>
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
