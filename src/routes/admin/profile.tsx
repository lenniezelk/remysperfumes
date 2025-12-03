import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form';
import { NotificationsList, useNotifications } from '@/components/notifications/Notification';
import { Input } from '@/components/Input';
import Heading from '@/components/Heading';
import { FieldInfo } from '@/components/FieldInfo';
import Button from '@/components/Button';
import { UpdateProfileData, updateProfile, getCurrentProfile } from '@/lib/server/users/profile';

export const Route = createFileRoute('/admin/profile')({
  component: RouteComponent,
  loader: async () => getCurrentProfile(),
})

function RouteComponent() {
  const notifications = useNotifications();
  const result = Route.useLoaderData();
  const router = useRouter();

  const user = result.status === 'SUCCESS' ? result.data : null;

  const form = useForm({
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      current_password: '',
      new_password: '',
      confirm_password: '',
    },
    validators: {
      onChange: UpdateProfileData,
    },
    onSubmit: async (values) => {
      const data = {
        name: values.value.name,
        email: values.value.email,
        current_password: values.value.current_password,
        new_password: values.value.new_password || '',
        confirm_password: values.value.confirm_password || '',
      }
      return updateProfile({
        data,
      }).then((result) => {
        notifications.clear();

        if (result.status === 'SUCCESS') {
          notifications.addNotification({
            message: 'Profile updated successfully.',
            type: 'SUCCESS',
          });
          // Reset password fields
          form.setFieldValue('current_password', '');
          form.setFieldValue('new_password', '');
          form.setFieldValue('confirm_password', '');
          router.invalidate();
        } else {
          notifications.addNotification({
            message: result.error || 'An error occurred while updating your profile.',
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

  if (!user) {
    return (
      <>
        <NotificationsList />
        <Heading level={2} className='mt-12'>Profile Not Found</Heading>
        <p>Unable to load your profile information.</p>
      </>
    );
  }

  return (
    <>
      <NotificationsList />
      <Heading level={2} className='mt-12 mb-4'>My Profile</Heading>

      {/* Read-only information */}
      <div className='mb-8 p-4 bg-base-200 rounded-lg max-w-md'>
        <h3 className='font-bold mb-2'>Account Information</h3>
        <div className='space-y-1 text-sm'>
          <p><span className='font-semibold'>Role:</span> {user.role?.name || 'No Role'}</p>
          <p><span className='font-semibold'>Status:</span> {user.is_active ? 'Active' : 'Inactive'}</p>
          <p><span className='font-semibold'>Member Since:</span> {new Date(user.created_at).toLocaleDateString()}</p>
          {user.last_login_at && (
            <p><span className='font-semibold'>Last Login:</span> {new Date(user.last_login_at).toLocaleDateString()}</p>
          )}
        </div>
      </div>

      <form
        className='mt-8 w-full max-w-md space-y-4'
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}>
        <div>
          <label className='label'>
            <span className='label-text'>Name</span>
          </label>
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
          <label className='label'>
            <span className='label-text'>Email</span>
          </label>
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

        <div className='divider'>Security</div>

        <div className='alert alert-info'>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          <span className='text-sm'>Your current password is required to save any changes. New passwords must be at least 8 characters and contain a letter, number, and special character.</span>
        </div>

        <div className='mt-2'>
          <label className='label'>
            <span className='label-text'>Current Password *</span>
          </label>
          <form.Field
            name="current_password"
            children={
              (field) => {
                return (
                  <>
                    <Input
                      type='password'
                      name={field.name}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder='Enter Current Password'
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
          <label className='label'>
            <span className='label-text'>New Password (optional)</span>
          </label>
          <form.Field
            name="new_password"
            children={
              (field) => {
                return (
                  <>
                    <Input
                      type='password'
                      name={field.name}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder='Must contain letter, number & special character (min 8)'
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
          <label className='label'>
            <span className='label-text'>Confirm New Password</span>
          </label>
          <form.Field
            name="confirm_password"
            children={
              (field) => {
                return (
                  <>
                    <Input
                      type='password'
                      name={field.name}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder='Confirm New Password'
                      hasError={field.state.meta.isTouched && !field.state.meta.isValid}
                    />
                    <FieldInfo field={field} />
                  </>
                )
              }
            }
          />
        </div>

        <div className='flex flex-row justify-end mt-8'>
          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
            children={([canSubmit, isSubmitting]) => (
              <Button
                type='submit'
                disabled={!canSubmit || isSubmitting}
              >
                {isSubmitting ? 'Updating...' : 'Update Profile'}
              </Button>
            )}
          />
        </div>
      </form>
    </>
  )
}
