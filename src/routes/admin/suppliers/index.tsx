import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { useRef, useState } from 'react';
import type { Supplier } from '@/lib/types';
import AppLink from '@/components/AppLink';
import Button from '@/components/Button';
import { NotificationsList, useNotifications } from '@/components/notifications/Notification';
import { deleteSupplier, restoreSupplier } from '@/lib/server/supplier/delete';
import { listSuppliers, ListSuppliersParams } from '@/lib/server/supplier/list'
import Heading from '@/components/Heading';
import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';
import { zodValidator } from '@tanstack/zod-adapter';
import { z } from 'zod';
import { debounce } from '@tanstack/pacer';
import { SearchInput } from '@/components/SearchInput';
import { Select } from '@/components/Select';

type ListQueryOptions = z.infer<typeof ListSuppliersParams>;

const listQueryOptions = (params: ListQueryOptions) => queryOptions({
  queryKey: ['suppliers', params],
  queryFn: () => listSuppliers({ data: params }),
})

export const Route = createFileRoute('/admin/suppliers/')({
  component: RouteComponent,
  head: () => ({
    meta: [
      { title: "Suppliers | Remi's Perfumes" },
    ]
  }),
  loaderDeps: ({ search: { searchQuery, sort, order, page, limit, showDeleted } }) => ({ searchQuery, sort, order, page, limit, showDeleted }),
  loader: async ({ context, deps }) => await context.queryClient.ensureQueryData(listQueryOptions(deps)),
  validateSearch: zodValidator(ListSuppliersParams),
})

const columnHelper = createColumnHelper<Supplier>();

function getColumns(
  onOpenDeleteDialog: (supplierId: string) => void,
  onOpenRestoreDialog: (supplierId: string) => void
) {
  return [
    columnHelper.accessor('name', {
      header: 'Name',
      cell: info => info.getValue(),
    }),
    columnHelper.accessor('contact_info', {
      header: 'Contact Info',
      cell: info => info.getValue() || '-',
    }),
    columnHelper.accessor('created_at', {
      header: 'Created At',
      cell: info => new Date(info.getValue()).toLocaleDateString(),
    }),
    columnHelper.display({
      id: 'edit',
      header: 'Edit',
      cell: info => (
        <AppLink
          to="/admin/suppliers/$supplierId"
          params={{ supplierId: info.row.original.id }}
          className="text-blue-600 hover:underline"
        >
          Edit
        </AppLink>
      ),
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: info => {
        const isDeleted = !!info.row.original.deleted_at;
        return isDeleted ? (
          <Button
            variant='primary'
            onClick={() => onOpenRestoreDialog(info.row.original.id)}
          >
            Restore
          </Button>
        ) : (
          <Button
            variant='error'
            onClick={() => onOpenDeleteDialog(info.row.original.id)}
          >
            Delete
          </Button>
        );
      },
    }),
  ];
}

function RouteComponent() {
  const search = Route.useSearch()
  const suppliersQuery = useSuspenseQuery(listQueryOptions(search))
  const data = suppliersQuery.data.status === 'SUCCESS' ? suppliersQuery.data.data.items : [];
  const total = suppliersQuery.data.status === 'SUCCESS' ? suppliersQuery.data.data.total : 0;
  const page = suppliersQuery.data.status === 'SUCCESS' ? suppliersQuery.data.data.page : 1;
  const limit = suppliersQuery.data.status === 'SUCCESS' ? suppliersQuery.data.data.limit : 10;
  const offset = suppliersQuery.data.status === 'SUCCESS' ? suppliersQuery.data.data.offset : 0;

  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
  const navigate = useNavigate({ from: Route.fullPath });
  const notifications = useNotifications();
  const deleteDialogRef = useRef<HTMLDialogElement>(null);
  const restoreDialogRef = useRef<HTMLDialogElement>(null);
  const [deleting, setDeleting] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState(search.searchQuery);

  const debouncedSearch = debounce((searchQuery: string) => {
    navigate({ search: (prev) => ({ ...prev, searchQuery, page: 1 }) })
  }, { wait: 500 })

  const deleteSupplierById = async (supplierId: string) => {
    setDeleting(true);
    notifications.clear();
    deleteSupplier({ data: { supplierId } }).then((result) => {
      if (result.status === 'SUCCESS') {
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

  const restoreSupplierById = async (supplierId: string) => {
    setRestoring(true);
    notifications.clear();
    restoreSupplier({ data: { supplierId } }).then((result) => {
      if (result.status === 'SUCCESS') {
        notifications.addNotification({
          message: 'Supplier restored successfully.',
          type: 'SUCCESS',
        });
        router.invalidate();
      } else {
        notifications.addNotification({
          message: result.error || 'An error occurred while restoring the supplier.',
          type: 'ERROR',
        });
      }
    }).catch((error) => {
      notifications.addNotification({
        message: error.message || 'An unexpected error occurred.',
        type: 'ERROR',
      });
    }).finally(() => {
      restoreDialogRef.current?.close();
      setRestoring(false);
    });
  }

  const openDeleteDialog = (supplierId: string) => {
    setSelectedSupplierId(supplierId);
    deleteDialogRef.current?.showModal();
  }

  const openRestoreDialog = (supplierId: string) => {
    setSelectedSupplierId(supplierId);
    restoreDialogRef.current?.showModal();
  }

  const columns = getColumns(openDeleteDialog, openRestoreDialog);
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className='w-full overflow-x-auto'>
      <NotificationsList />
      <div className="flex flex-wrap justify-between mb-4 items-center py-4 gap-4">
        <Heading level={4}>Suppliers</Heading>
        <div className="flex flex-wrap gap-4 items-center">
          <SearchInput
            name="searchQuery"
            placeholder="Search suppliers..."
            className="min-w-64"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); debouncedSearch(e.target.value) }}
          />
          <div className="flex gap-2 shrink-0">
            <div className="w-48">
              <Select
                name="sort"
                value={search.sort}
                onChange={(e) => navigate({ search: (prev) => ({ ...prev, sort: e.target.value as "name" | "created_at" }) })}
              >
                <option value="created_at">Sort by: Date Created</option>
                <option value="name">Sort by: Name</option>
              </Select>
            </div>
            <div className="w-36">
              <Select
                name="order"
                value={search.order}
                onChange={(e) => navigate({ search: (prev) => ({ ...prev, order: e.target.value as "asc" | "desc" }) })}
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </Select>
            </div>
          </div>
          <div className="w-36 shrink-0">
            <Select
              name="limit"
              value={search.limit.toString()}
              onChange={(e) => navigate({ search: (prev) => ({ ...prev, limit: parseInt(e.target.value), page: 1 }) })}
            >
              <option value="10">10 per page</option>
              <option value="25">25 per page</option>
              <option value="50">50 per page</option>
              <option value="100">100 per page</option>
            </Select>
          </div>
          <div className="flex gap-2 shrink-0 flex-wrap">
            <Button
              variant={search.showDeleted ? "primary" : "neutral"}
              onClick={() => navigate({ search: (prev) => ({ ...prev, showDeleted: !prev.showDeleted, page: 1 }) })}
            >
              {search.showDeleted ? "Hide Deleted" : "Show Deleted"}
            </Button>
            <Button
              variant="neutral"
              onClick={() => {
                setSearchQuery("");
                navigate({
                  search: {
                    searchQuery: "",
                    sort: "created_at",
                    order: "desc",
                    page: 1,
                    limit: 10,
                    showDeleted: false
                  }
                });
              }}
            >
              Clear Filters
            </Button>
            <Button variant="primary" onClick={() => navigate({ to: '/admin/suppliers/new' })}>
              Create New Supplier
            </Button>
          </div>
        </div>
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
          {(!data || data.length === 0) ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                No suppliers found.
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map(row => (
              <tr
                key={row.id}
                className={row.original.deleted_at ? "bg-red-50" : ""}
              >
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
            ))
          )}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={table.getAllColumns().length} className="h-10">
              <div className="flex justify-end pr-4 mt-4">
                <div className="flex items-center gap-3">
                  <AppLink
                    disabled={page <= 1}
                    from={Route.fullPath}
                    search={(prev) => ({ ...prev, page: Math.max((prev.page || 1) - 1, 1) })}
                  >Previous</AppLink>
                  <span className="text-sm text-gray-500">Showing {offset + 1} to {offset + data.length} of {total} suppliers</span>
                  <AppLink
                    disabled={offset + limit >= total}
                    from={Route.fullPath}
                    search={(prev) => ({ ...prev, page: (prev.page || 1) + 1 })}
                  >Next</AppLink>
                </div>
              </div>
            </td>
          </tr>
        </tfoot>
      </table>

      {/* Delete Confirmation Dialog */}
      <dialog id="confirmDelete" className="modal" ref={deleteDialogRef}>
        <div className="modal-box">
          <form method="dialog">
            <button disabled={deleting} className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
          </form>
          <p className="font-bold text-lg">Are you sure you want to delete this supplier?</p>
          <p className="text-sm text-gray-500 mt-2">This will soft delete the supplier. You can restore it later.</p>
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

      {/* Restore Confirmation Dialog */}
      <dialog id="confirmRestore" className="modal" ref={restoreDialogRef}>
        <div className="modal-box">
          <form method="dialog">
            <button disabled={restoring} className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
          </form>
          <p className="font-bold text-lg">Are you sure you want to restore this supplier?</p>
          <div className="modal-action">
            <Button disabled={restoring} variant="neutral" onClick={() => {
              restoreDialogRef.current?.close();
            }}>Cancel</Button>
            <div>
              <Button
                disabled={restoring}
                variant="primary"
                onClick={() => {
                  if (selectedSupplierId) {
                    restoreSupplierById(selectedSupplierId);
                  }
                }}
              >
                {restoring ? "Restoring..." : "Restore"}
              </Button>
            </div>
          </div>
        </div>
      </dialog>
    </div>
  )
}
