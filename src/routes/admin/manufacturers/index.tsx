import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { useEffect, useRef, useState } from 'react';
import type { Manufacturer } from '@/lib/types';
import AppLink from '@/components/AppLink';
import Button from '@/components/Button';
import { useNotifications } from '@/components/notifications/Notification';
import { deleteManufacturer } from '@/lib/server/manufacturer/delete';
import { listManufacturers } from '@/lib/server/manufacturer/list'

export const Route = createFileRoute('/admin/manufacturers/')({
    component: RouteComponent,
    loader: () => listManufacturers(),
})

const columnHelper = createColumnHelper<Manufacturer>();

function getColumns(onOpenDeleteDialog: (manufacturerId: string) => void) {
    return [
        columnHelper.accessor('name', {
            header: 'Name',
            cell: info => info.getValue(),
        }),
        columnHelper.accessor('contact_info', {
            header: 'Contact Info',
            cell: info => info.getValue(),
        }),
        columnHelper.display({
            id: 'deleted',
            header: 'Deleted?',
            cell: info => (
                info.row.original.deleted_at ? `Deleted at ${info.row.original.deleted_at.toLocaleString()}` : 'No'
            ),
        }),
        columnHelper.display({
            id: 'edit',
            header: 'Edit',
            cell: info => (
                <AppLink
                    to="/admin/manufacturers/$manufacturerId"
                    params={{ manufacturerId: info.row.original.id }}
                >
                    Edit
                </AppLink>
            ),
        }),
        columnHelper.display({
            id: 'delete',
            header: 'Delete',
            cell: info => (
                <Button
                    variant='error'
                    onClick={() => onOpenDeleteDialog(info.row.original.id)}
                >
                    Delete
                </Button>
            ),
        }),
    ];
}

function RouteComponent() {
    const initialData = Route.useLoaderData()
    const [data, setData] = useState<Array<Manufacturer>>(() => initialData.status === 'SUCCESS' ? initialData.data : []);
    const [selectedManufacturerId, setSelectedManufacturerId] = useState<string | null>(null);
    const navigate = useNavigate();
    const notifications = useNotifications();
    const deleteDialogRef = useRef<HTMLDialogElement>(null);
    const [deleting, setDeleting] = useState(false);
    const router = useRouter();

    // Sync data when loader data changes (e.g., after router.invalidate())
    useEffect(() => {
        if (initialData.status === 'SUCCESS') {
            setData(initialData.data);
        }
    }, [initialData]);

    const deleteManufacturerById = async (manufacturerId: string) => {
        setDeleting(true);
        notifications.clear();
        deleteManufacturer({ data: { manufacturerId } }).then((result) => {
            if (result.status === 'SUCCESS') {
                setData(data.filter(manufacturer => manufacturer.id !== manufacturerId));
                notifications.addNotification({
                    message: 'Manufacturer deleted successfully.',
                    type: 'SUCCESS',
                });
                router.invalidate();
            } else {
                notifications.addNotification({
                    message: result.error || 'An error occurred while deleting the manufacturer.',
                    type: 'ERROR',
                });
            }
        }).catch((error) => {
            notifications.addNotification({
                message: error.message || 'An unexpected error occurred.',
                type: 'ERROR',
            });
        }).finally(() => {
            deleteDialogRef.current?.close();
            setDeleting(false);
        });
    }

    const openDeleteDialog = (manufacturerId: string) => {
        setSelectedManufacturerId(manufacturerId);
        deleteDialogRef.current?.showModal();
    }

    const columns = getColumns(openDeleteDialog);
    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
    })

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
            <dialog id="confirmDelete" className="modal" ref={deleteDialogRef}>
                <div className="modal-box">
                    <form method="dialog">
                        {/* if there is a button in form, it will close the modal */}
                        <button disabled={deleting} className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
                    </form>
                    <p className="font-bold text-lg">Are you sure you want to delete this manufacturer?</p>
                    <div className="modal-action">
                        <Button disabled={deleting} variant="neutral" onClick={() => {
                            deleteDialogRef.current?.close();
                        }}>Cancel</Button>
                        <div>
                            <Button
                                disabled={deleting}
                                variant="error"
                                onClick={() => {
                                    if (selectedManufacturerId) {
                                        deleteManufacturerById(selectedManufacturerId);
                                    }
                                }}
                            >
                                {deleting ? "Deleting..." : "Delete"}
                            </Button>
                        </div>
                    </div>
                </div>
            </dialog>
        </div>
    )
}
