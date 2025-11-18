import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
import { NotificationsList, useNotifications } from '@/components/notifications/Notification';
import { useForm } from '@tanstack/react-form';
import { Input } from '@/components/Input';
import Heading from '@/components/Heading';
import { FieldInfo } from '@/components/FieldInfo';
import Button from '@/components/Button';
import { createAdminUser, fetchCreateUserInitialData, CreateUserData } from '@/lib/server/users/users';

export const Route = createFileRoute('/admin/users/new')({
  component: RouteComponent,
  loader: async () => fetchCreateUserInitialData(),
})

function RouteComponent() {
  const notifications = useNotifications();
  const { roles } = Route.useLoaderData();
  const navigate = useNavigate();
  const router = useRouter();
  const form = useForm({
    defaultValues: {
      name: '',
      email: '',
      role_id: roles.length > 0 ? roles.find(role => role.key === 'staff')?.id : '',
      is_active: true,
    },
    validators: {
      onChange: CreateUserData,
    },
    onSubmit: async (values) => {
      const data = {
        name: values.value.name,
        email: values.value.email,
        role_id: values.value.role_id || '',
        is_active: values.value.is_active,
      }
      createAdminUser({
        data,
      }).then((result) => {
        notifications.clear();

        if (result.status === 'SUCCESS') {
          notifications.addNotification({
            message: 'User created successfully.',
            type: 'SUCCESS',
          });
          // Reset form
          form.reset();
          router.invalidate();
          navigate({ to: '/admin/users' });
        } else {
          notifications.addNotification({
            message: result.error || 'An error occurred while creating the user.',
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

  return (
    <>
      <NotificationsList />
      <Heading level={2} className='mt-12'>Create New User</Heading>
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
                    <span>Is Active?</span>
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
                {isSubmitting ? 'Creating...' : 'Create User'}
              </Button>
            )}
          />
        </div>
      </form>
    </>
  )
}
