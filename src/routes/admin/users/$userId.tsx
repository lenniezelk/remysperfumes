import Container from '@/components/Container'
import { FieldInfo } from '@/components/FieldInfo'
import Heading from '@/components/Heading'
import { Input } from '@/components/Input'
import Button from '@/components/Button'
import { useNotifications } from '@/components/notifications/Notification'
import { fetchEditUserInitialData, updateAdminUser, UpdateUserData } from '@/lib/server/users/users'
import { useForm } from '@tanstack/react-form'
import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'

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
  const form = useForm({
    defaultValues: {
      userId: user ? user.id : '',
      name: user ? user.name : '',
      email: user ? user.email : '',
      role_id: user ? user?.role?.id || '' : '',
      createNewPassword: false,
      is_active: user ? user.is_active : true,
      delete_user: user ? user.deleted_at !== null : false,
      restore_user: user ? user.deleted_at === null : false,
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
        createNewPassword: values.value.createNewPassword,
        delete_user: values.value.delete_user,
        restore_user: values.value.restore_user,
      }
      updateAdminUser({
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
      <Heading level={2} className='mt-12 mb-4'>
        Edit/Delete User
      </Heading>
      <form
        className='mt-8 w-full max-w-md space-y-4'
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}>
        <div>
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
            name="createNewPassword"
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
                    <span>Generate New Password? (New Password will be sent to user's email)</span>
                  </label>
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
        <div className='mt-2'>
          <form.Field
            name="delete_user"
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
                      disabled={user?.deleted_at ? true : false}
                    />
                    <span>{user?.deleted_at ? `User was deleted at ${new Date(user.deleted_at).toLocaleString()}` : "Delete User?"}</span>
                  </label>
                )
              }
            }
          />
        </div>
        <div className='mt-2'>
          <form.Field
            name="restore_user"
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
                      disabled={user?.deleted_at ? false : true}
                    />
                    <span>{user?.deleted_at ? "Restore User?" : "User is not deleted"}</span>
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
            onClick={() => navigate({ to: '/admin/users' })}
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
    </>
  )
}
