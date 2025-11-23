import AppLink from '@/components/AppLink';
import Button from '@/components/Button';
import { useNotifications } from '@/components/notifications/Notification';
import { deleteStockBatch } from '@/lib/server/stock-batch/delete';
import { listStockBatches } from '@/lib/server/stock-batch/list'
import { StockBatch } from '@/lib/types';
import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { useEffect, useRef, useState } from 'react';

export const Route = createFileRoute('/admin/stock-batches/')({
    component: RouteComponent,
    loader: () => listStockBatches(),
})

const columnHelper = createColumnHelper<StockBatch>();

function getColumns(onOpenDeleteDialog: (stockBatchId: string) => void) {
    return [
        columnHelper.accessor('product_variant_id', {
            header: 'Product Variant ID',
            cell: info => info.getValue().substring(0, 8) + '...',
        }),
        columnHelper.accessor('quantity_received', {
            header: 'Qty Received',
            cell: info => info.getValue(),
        }),
        columnHelper.accessor('quantity_remaining', {
            header: 'Qty Remaining',
            cell: info => info.getValue(),
        }),
        columnHelper.accessor('buy_price_per_unit', {
            header: 'Buy Price',
            cell: info => `$${(info.getValue() / 100).toFixed(2)}`,
        }),
        columnHelper.accessor('sell_price_per_unit', {
            header: 'Sell Price',
            cell: info => `$${(info.getValue() / 100).toFixed(2)}`,
        }),
        columnHelper.accessor('min_sale_price_per_unit', {
            header: 'Min Price',
            cell: info => `$${(info.getValue() / 100).toFixed(2)}`,
        }),
        columnHelper.accessor('received_at', {
            header: 'Received Date',
            cell: info => new Date(info.getValue()).toLocaleDateString(),
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
                    to="/admin/stock-batches/$stockBatchId"
                    params={{ stockBatchId: info.row.original.id }}
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
    const [data, setData] = useState<StockBatch[]>(() => initialData.status === 'SUCCESS' ? initialData.data : []);
    const [selectedStockBatchId, setSelectedStockBatchId] = useState<string | null>(null);
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

    const deleteStockBatchById = async (stockBatchId: string) => {
        setDeleting(true);
        notifications.clear();
        deleteStockBatch({ data: { stockBatchId } }).then((result) => {
            if (result.status === 'SUCCESS') {
                setData(data.filter(stockBatch => stockBatch.id !== stockBatchId));
                notifications.addNotification({
                    message: 'Stock batch deleted successfully.',
                    type: 'SUCCESS',
                });
                router.invalidate();
            } else {
                notifications.addNotification({
                    message: result.error || 'An error occurred while deleting the stock batch.',
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

    const openDeleteDialog = (stockBatchId: string) => {
        setSelectedStockBatchId(stockBatchId);
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
                <Button variant="primary" onClick={() => navigate({ to: '/admin/stock-batches/new' })}>
                    Create New Stock Batch
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
                    <p className="font-bold text-lg">Are you sure you want to delete this stock batch?</p>
                    <div className="modal-action">
                        <Button disabled={deleting} variant="neutral" onClick={() => {
                            deleteDialogRef.current?.close();
                        }}>Cancel</Button>
                        <div>
                            <Button
                                disabled={deleting}
                                variant="error"
                                onClick={() => {
                                    if (selectedStockBatchId) {
                                        deleteStockBatchById(selectedStockBatchId);
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
