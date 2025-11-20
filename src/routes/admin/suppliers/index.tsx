import AppLink from '@/components/AppLink';
import Button from '@/components/Button';
import { useNotifications } from '@/components/notifications/Notification';
import { deleteSupplier } from '@/lib/server/supplier/delete';
import { listSuppliers } from '@/lib/server/supplier/list'
import { Supplier } from '@/lib/types';
import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { useRef, useState } from 'react';

export const Route = createFileRoute('/admin/suppliers/')({
  component: RouteComponent,
  loader: () => listSuppliers(),
})

const columnHelper = createColumnHelper<Supplier>();

function getColumns(onOpenDeleteDialog: (supplierId: string) => void) {
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
          to="/admin/suppliers/$supplierId"
          params={{ supplierId: info.row.original.id }}
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
  const [data, setData] = useState<Supplier[]>(() => initialData.status === 'SUCCESS' ? initialData.data : []);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
  const navigate = useNavigate();
  const notifications = useNotifications();
  const deleteDialogRef = useRef<HTMLDialogElement>(null);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  const deleteSupplierById = async (supplierId: string) => {
    setDeleting(true);
    notifications.clear();
    deleteSupplier({ data: { supplierId } }).then((result) => {
      if (result.status === 'SUCCESS') {
        setData(data.filter(supplier => supplier.id !== supplierId));
        notifications.addNotification({
          message: 'Supplier deleted successfully.',
          type: 'SUCCESS',
        });
        router.invalidate();
      } else {
        notifications.addNotification({
          message: result.error || 'An error occurred while deleting the supplier.',
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

  const openDeleteDialog = (supplierId: string) => {
    setSelectedSupplierId(supplierId);
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
        <Button variant="primary" onClick={() => navigate({ to: '/admin/suppliers/new' })}>
          Create New Supplier
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
          <p className="font-bold text-lg">Are you sure you want to delete this supplier?</p>
          <div className="modal-action">
            <Button disabled={deleting} variant="neutral" onClick={() => {
              deleteDialogRef.current?.close();
            }}>Cancel</Button>
            <div>
              <Button
                disabled={deleting}
                variant="error"
                onClick={() => {
                  if (selectedSupplierId) {
                    deleteSupplierById(selectedSupplierId);
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
