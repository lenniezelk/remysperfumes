import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { useEffect, useRef, useState } from 'react';
import type { ProductVariant } from '@/lib/types';
import AppLink from '@/components/AppLink';
import Button from '@/components/Button';
import { NotificationsList, useNotifications } from '@/components/notifications/Notification';
import { deleteProductVariant } from '@/lib/server/product-variant/delete';
import { listProductVariants } from '@/lib/server/product-variant/list'

export const Route = createFileRoute('/admin/product-variants/')({
    component: RouteComponent,
    loader: () => listProductVariants(),
})

const columnHelper = createColumnHelper<ProductVariant>();

function getColumns(onOpenDeleteDialog: (productVariantId: string) => void) {
    return [
        columnHelper.accessor('product_id', {
            header: 'Product ID',
            cell: info => {
                const value = info.getValue();
                return value ? value.substring(0, 8) + '...' : 'N/A';
            },
        }),
        columnHelper.accessor('name', {
            header: 'Variant Name',
            cell: info => info.getValue(),
        }),
        columnHelper.accessor('sku', {
            header: 'SKU',
            cell: info => info.getValue(),
        }),
        columnHelper.accessor('default_sell_price', {
            header: 'Sell Price',
            cell: info => {
                const value = info.getValue();
                return value ? `${(value).toFixed(2)}` : 'N/A';
            },
        }),
        columnHelper.accessor('image', {
            header: 'Image',
            cell: info => info.getValue() ? 'Yes' : 'No',
        }),
        columnHelper.accessor('created_at', {
            header: 'Created Date',
            cell: info => new Date(info.getValue()).toLocaleDateString(),
        }),
        columnHelper.display({
            id: 'edit',
            header: 'Edit',
            cell: info => (
                <AppLink
                    to="/admin/product-variants/$productVariantId"
                    params={{ productVariantId: info.row.original.id }}
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
    const [data, setData] = useState<Array<ProductVariant>>(() => initialData.status === 'SUCCESS' ? initialData.data : []);
    const [selectedProductVariantId, setSelectedProductVariantId] = useState<string | null>(null);
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

    const deleteProductVariantById = async (productVariantId: string) => {
        setDeleting(true);
        notifications.clear();
        deleteProductVariant({ data: { productVariantId } }).then((result) => {
            if (result.status === 'SUCCESS') {
                setData(data.filter(variant => variant.id !== productVariantId));
                notifications.addNotification({
                    message: 'Product variant deleted successfully.',
                    type: 'SUCCESS',
                });
                router.invalidate();
            } else {
                notifications.addNotification({
                    message: result.error || 'An error occurred while deleting the product variant.',
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

    const openDeleteDialog = (productVariantId: string) => {
        setSelectedProductVariantId(productVariantId);
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
            <NotificationsList />
            <div className="flex justify-end my-8">
                <Button variant="primary" onClick={() => {
                    notifications.clear();
                    navigate({ to: '/admin/product-variants/new' })
                }}>
                    Create New Product Variant
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
                    <p className="font-bold text-lg">Are you sure you want to delete this product variant?</p>
                    <div className="modal-action">
                        <Button disabled={deleting} variant="neutral" onClick={() => {
                            deleteDialogRef.current?.close();
                        }}>Cancel</Button>
                        <div>
                            <Button
                                disabled={deleting}
                                variant="error"
                                onClick={() => {
                                    if (selectedProductVariantId) {
                                        deleteProductVariantById(selectedProductVariantId);
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
