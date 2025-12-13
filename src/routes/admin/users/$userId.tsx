import { useForm } from '@tanstack/react-form'
import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
import Container from '@/components/Container'
import { FieldInfo } from '@/components/FieldInfo'
import Heading from '@/components/Heading'
import { Input } from '@/components/Input'
import Button from '@/components/Button'
import { useNotifications, NotificationsList } from '@/components/notifications/Notification'
import { fetchEditUserInitialData } from '@/lib/server/users/get'
import { UpdateUserData, updateAdminUser } from '@/lib/server/users/update'
import { resetPassword } from '@/lib/server/users/resetPassword'
import { useRef, useState } from 'react'

export const Route = createFileRoute('/admin/users/$userId')({
  component: RouteComponent,
  loader: async (ctx) => await fetchEditUserInitialData({ data: { userId: ctx.params.userId } }),
})

function RouteComponent() {
  const result = Route.useLoaderData()
  const roles = result.status === 'SUCCESS' ? result.data.roles : [];
  const user = result.status === 'SUCCESS' ? result.data.user : null;
  const notifications = useNotifications();
  const navigate = useNavigate();
  const router = useRouter();

  const resetPasswordDialogRef = useRef<HTMLDialogElement>(null);
  const [resettingPassword, setResettingPassword] = useState(false);

  const resetUserPassword = async () => {
    if (!user) return;
    setResettingPassword(true);
    notifications.clear();

    try {
      const result = await resetPassword({ data: { userId: user.id } });
      if (result.status === 'SUCCESS') {
        notifications.addNotification({
          message: 'Password reset successfully. New password has been sent to the user.',
          type: 'SUCCESS',
        });
        resetPasswordDialogRef.current?.close();
      } else {
        notifications.addNotification({
          message: result.error || 'Failed to reset password.',
          type: 'ERROR',
        });
      }
    } catch (error: any) {
      notifications.addNotification({
        message: error.message || 'An unexpected error occurred.',
        type: 'ERROR',
      });
    } finally {
      setResettingPassword(false);
    }
  };

  const form = useForm({
    defaultValues: {
      userId: user ? user.id : '',
      name: user ? user.name : '',
      email: user ? user.email : '',
      role_id: user ? user?.role?.id || '' : '',
      is_active: user ? user.is_active : true,
    },
    validators: {
      onChange: UpdateUserData,
    },
    onSubmit: async (values) => {
      const data = {
        userId: values.value.userId,
        name: values.value.name,
        email: values.value.email,
        role_id: values.value.role_id || '',
        is_active: values.value.is_active,
      }
      return updateAdminUser({
        data,
      }).then((result) => {
        notifications.clear();

        if (result.status === 'SUCCESS') {
          notifications.addNotification({
            message: 'User updated successfully.',
            type: 'SUCCESS',
          });
          router.invalidate();
          navigate({ to: '/admin/users' });
        } else {
          notifications.addNotification({
            message: result.error || 'An error occurred while updating the user.',
            type: 'ERROR',
          });
        }
      }).catch((error) => {
        notifications.addNotification({
          message: error.message || 'An unexpected error occurred.',
          type: 'ERROR',
        });
      });
    }
  });

  if (result.status !== 'SUCCESS') {
    return (
      <Container>
        <Heading level={2} className='mt-12 mb-4'>
          User Not Found
        </Heading>
        <p>The requested user could not be found.</p>
      </Container>
    )
  }

  return (
    <>
      <NotificationsList />
      <div className="flex justify-between items-center mt-12 mb-4">
        <Heading level={2}>
          Edit User
        </Heading>

      </div>
      <form
        className='mt-8 w-full max-w-md space-y-4'
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}>
        <div className='flex justify-end'>
          <Button
            variant="neutral"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              resetPasswordDialogRef.current?.showModal()
            }}
          >
            Reset Password
          </Button>
        </div>
        <div className='mt-2'>
          <form.Field
            name="name"
            children={
              (field) => {
                return (
                  <>
                    <Input
                      name={field.name}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder='Enter Name'
                      hasError={field.state.meta.isTouched && !field.state.meta.isValid}
                    />
                    <FieldInfo field={field} />
                  </>
                )
              }
            }
          />
        </div>
        <div className='mt-2'>
          <form.Field
            name="email"
            children={
              (field) => {
                return (
                  <>
                    <Input
                      type='email'
                      name={field.name}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder='Enter Email'
                      hasError={field.state.meta.isTouched && !field.state.meta.isValid}
                    />
                    <FieldInfo field={field} />
                  </>
                )
              }
            }
          />
        </div>
        <div className='mt-2'>
          <form.Field
            name="role_id"
            children={
              (field) => {
                return (
                  <>
                    <select
                      name={field.name}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className='select w-full'
                    >
                      {roles.map((role) => (
                        <option key={role.id} value={role.id}>{role.name}</option>
                      ))}
                    </select>
                    <FieldInfo field={field} />
                  </>
                )
              }
            }
          />
        </div>
        <div className='mt-2'>
          <form.Field
            name="is_active"
            children={
              (field) => {
                return (
                  <label className='flex items-center space-x-2'>
                    <input
                      type='checkbox'
                      name={field.name}
                      checked={field.state.value}
                      onChange={(e) => field.handleChange(e.target.checked)}
                      className='checkbox'
                    />
                    <span>Is Active</span>
                  </label>
                )
              }
            }
          />
        </div>
        <div className='flex flex-row justify-between mt-8'>
          <button
            type='button'
            className='btn btn-neutral'
            onClick={() => {
              notifications.clear();
              navigate({ to: '/admin/users' });
              form.reset();
            }}
          >
            Cancel
          </button>
          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
            children={([canSubmit, isSubmitting]) => (
              <Button
                type='submit'
                disabled={!canSubmit || isSubmitting}
              >
                {isSubmitting ? 'Updating...' : 'Save Changes'}
              </Button>
            )}
          />
        </div>
      </form>

      {/* Reset Password Confirmation Dialog */}
      <dialog id="resetPasswordMetrics" className="modal" ref={resetPasswordDialogRef}>
        <div className="modal-box">
          <form method="dialog">
            <button disabled={resettingPassword} className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
          </form>
          <h3 className="font-bold text-lg">Reset Password</h3>
          <p className="py-4">Are you sure you want to reset the password for <strong>{user?.name}</strong>? A new password will be generated and sent to their email.</p>
          <div className="modal-action">
            <form method="dialog">
              <button disabled={resettingPassword} className="btn btn-neutral mr-2">Cancel</button>
              <button
                disabled={resettingPassword}
                className="btn btn-primary"
                onClick={(e) => {
                  e.preventDefault();
                  resetUserPassword();
                }}
              >
                {resettingPassword ? "Resetting..." : "Confirm Reset"}
              </button>
            </form>
          </div>
        </div>
      </dialog>
    </>
  )
}
