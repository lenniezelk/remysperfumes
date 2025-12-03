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
import { useEffect, useRef, useState } from 'react'
import type { UserWithPermissions } from '@/lib/types';
import { listUsers } from '@/lib/server/users/list'
import { deleteAdminUser, restoreAdminUser } from '@/lib/server/users/delete'
import AppLink from '@/components/AppLink'
import Button from '@/components/Button'
import Heading from '@/components/Heading';
import { NotificationsList, useNotifications } from '@/components/notifications/Notification';

export const Route = createFileRoute('/admin/users/')({
  component: RouteComponent,
  loader: () => listUsers(),
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
  const initialData = Route.useLoaderData()
  const [data, setData] = useState<Array<UserWithPermissions>>(() =>
    initialData.status === 'SUCCESS' ? initialData.data : [],
  )
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const navigate = useNavigate()
  const notifications = useNotifications();
  const deleteDialogRef = useRef<HTMLDialogElement>(null);
  const restoreDialogRef = useRef<HTMLDialogElement>(null);
  const [deleting, setDeleting] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const router = useRouter();

  // Sync data when loader data changes (e.g., after router.invalidate())
  useEffect(() => {
    if (initialData.status === 'SUCCESS') {
      setData(initialData.data);
    }
  }, [initialData]);

  const deleteUserById = async (userId: string) => {
    setDeleting(true);
    notifications.clear();
    deleteAdminUser({ data: { userId } }).then((result) => {
      if (result.status === 'SUCCESS') {
        setData(data.map(user =>
          user.id === userId ? { ...user, deleted_at: new Date() } : user
        ));
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
        setData(data.map(user =>
          user.id === userId ? { ...user, deleted_at: null } : user
        ));
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
      <div className="flex justify-between mb-4 items-center">
        <Heading level={4}>
          Users
        </Heading>
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
