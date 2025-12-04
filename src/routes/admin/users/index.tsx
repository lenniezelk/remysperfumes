import {
  createFileRoute,
  useNavigate,
  useRouter,
} from '@tanstack/react-router'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { useRef, useState } from 'react'
import type { UserWithPermissions } from '@/lib/types';
import { listUsers, ListUsersParams } from '@/lib/server/users/list'
import { deleteAdminUser, restoreAdminUser } from '@/lib/server/users/delete'
import AppLink from '@/components/AppLink'
import Button from '@/components/Button'
import Heading from '@/components/Heading';
import { NotificationsList, useNotifications } from '@/components/notifications/Notification';
import { z } from 'zod'
import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';
import { zodValidator } from '@tanstack/zod-adapter'
import { debounce } from '@tanstack/pacer'
import { SearchInput } from '@/components/SearchInput';
import { Select } from '@/components/Select';

type ListQueryOptions = z.infer<typeof ListUsersParams>;

const listQueryOptions = (params: ListQueryOptions) => queryOptions({
  queryKey: ['users', params],
  queryFn: () => listUsers({ data: params }),
})



export const Route = createFileRoute('/admin/users/')({
  component: RouteComponent,
  head: () => ({
    meta: [
      { title: "Users | Remi's Perfumes" },
    ]
  }),
  loaderDeps: ({ search: { searchQuery, role, is_active, sort, order, page, limit, showDeleted } }) => ({ searchQuery, role, is_active, sort, order, page, limit, showDeleted }),
  loader: async ({ context, deps: { searchQuery, role, is_active, sort, order, page, limit, showDeleted } }) => await context.queryClient.ensureQueryData(listQueryOptions({ searchQuery, role, is_active, sort, order, page, limit, showDeleted })),
  validateSearch: zodValidator(ListUsersParams),
})

const columnHelper = createColumnHelper<UserWithPermissions>()

function getColumns(
  onOpenDeleteDialog: (userId: string) => void,
  onOpenRestoreDialog: (userId: string) => void
) {
  return [
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
      id: 'edit',
      header: 'Edit',
      cell: (info) => (
        <AppLink
          to="/admin/users/$userId"
          params={{ userId: info.row.original.id }}
          disabled={!info.row.original.canEditOrDelete}
        >
          Edit
        </AppLink>
      ),
    }),
    columnHelper.display({
      id: 'delete',
      header: 'Delete/Restore',
      cell: (info) => {
        const user = info.row.original;
        const isDeleted = !!user.deleted_at;

        if (!user.canEditOrDelete) {
          return null;
        }

        return isDeleted ? (
          <Button
            variant='primary'
            onClick={() => onOpenRestoreDialog(user.id)}
          >
            Restore
          </Button>
        ) : (
          <Button
            variant='error'
            onClick={() => onOpenDeleteDialog(user.id)}
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
  const usersQuery = useSuspenseQuery(listQueryOptions(search))
  const data = usersQuery.data.status === 'SUCCESS' ? usersQuery.data.data.items : [];
  const total = usersQuery.data.status === 'SUCCESS' ? usersQuery.data.data.total : 0;
  const page = usersQuery.data.status === 'SUCCESS' ? usersQuery.data.data.page : 1;
  const limit = usersQuery.data.status === 'SUCCESS' ? usersQuery.data.data.limit : 10;
  const offset = usersQuery.data.status === 'SUCCESS' ? usersQuery.data.data.offset : 0;
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const navigate = useNavigate({ from: Route.fullPath })
  const notifications = useNotifications();
  const deleteDialogRef = useRef<HTMLDialogElement>(null);
  const restoreDialogRef = useRef<HTMLDialogElement>(null);
  const [deleting, setDeleting] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState(search.searchQuery);


  const debouncedSearch = debounce((searchQuery: string) => {
    navigate({ search: (prev) => ({ ...prev, searchQuery }) })
  }, { wait: 500 })

  const deleteUserById = async (userId: string) => {
    setDeleting(true);
    notifications.clear();
    deleteAdminUser({ data: { userId } }).then((result) => {
      if (result.status === 'SUCCESS') {
        notifications.addNotification({
          message: 'User deleted successfully.',
          type: 'SUCCESS',
        });
        router.invalidate();
      } else {
        notifications.addNotification({
          message: result.error || 'An error occurred while deleting the user.',
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

  const restoreUserById = async (userId: string) => {
    setRestoring(true);
    notifications.clear();
    restoreAdminUser({ data: { userId } }).then((result) => {
      if (result.status === 'SUCCESS') {
        notifications.addNotification({
          message: 'User restored successfully.',
          type: 'SUCCESS',
        });
        router.invalidate();
      } else {
        notifications.addNotification({
          message: result.error || 'An error occurred while restoring the user.',
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

  const openDeleteDialog = (userId: string) => {
    setSelectedUserId(userId);
    deleteDialogRef.current?.showModal();
  }

  const openRestoreDialog = (userId: string) => {
    setSelectedUserId(userId);
    restoreDialogRef.current?.showModal();
  }

  const columns = getColumns(openDeleteDialog, openRestoreDialog);
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="w-full overflow-x-auto">
      <NotificationsList />
      <div className="flex justify-between mb-4 items-center py-4">
        <Heading level={4}>
          Users
        </Heading>
        <div className="flex gap-4">
          <SearchInput
            name="searchQuery"
            placeholder="Search users..."
            className="min-w-64"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); debouncedSearch(e.target.value) }}
          />
          <Select
            name="sort"
            value={search.sort}
            onChange={(e) => navigate({ search: (prev) => ({ ...prev, sort: e.target.value as "name" | "created_at" }) })}
          >
            <option value="created_at">Sort by: Date Created</option>
            <option value="name">Sort by: Name</option>
          </Select>
          <Select
            name="order"
            value={search.order}
            onChange={(e) => navigate({ search: (prev) => ({ ...prev, order: e.target.value as "asc" | "desc" }) })}
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </Select>
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
          <Button
            variant="primary"
            onClick={() => {
              notifications.clear();
              navigate({ to: '/admin/users/new' });
            }}
          >
            Create New User
          </Button>
        </div>
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
                  <span className="text-sm text-gray-500">Showing {offset + 1} to {offset + table.getFilteredRowModel().rows.length} of {total} users</span>
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
          <p className="font-bold text-lg">Are you sure you want to delete this user?</p>
          <p className="text-sm text-gray-500 mt-2">This will soft delete the user. You can restore them later.</p>
          <div className="modal-action">
            <Button disabled={deleting} variant="neutral" onClick={() => {
              deleteDialogRef.current?.close();
            }}>Cancel</Button>
            <div>
              <Button
                disabled={deleting}
                variant="error"
                onClick={() => {
                  if (selectedUserId) {
                    deleteUserById(selectedUserId);
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
          <p className="font-bold text-lg">Are you sure you want to restore this user?</p>
          <p className="text-sm text-gray-500 mt-2">This will restore the user's access.</p>
          <div className="modal-action">
            <Button disabled={restoring} variant="neutral" onClick={() => {
              restoreDialogRef.current?.close();
            }}>Cancel</Button>
            <div>
              <Button
                disabled={restoring}
                variant="primary"
                onClick={() => {
                  if (selectedUserId) {
                    restoreUserById(selectedUserId);
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
