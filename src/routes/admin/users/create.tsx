import Container from '@/components/Container';
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useNotifications } from '@/components/notifications/Notification';
import { useForm } from '@tanstack/react-form';
import { CreateUserData } from '@/lib/types';
import { Input } from '@/components/Input';
import { fetchCreateUserInitialData } from '@/lib/auth/auth';
import Heading from '@/components/Heading';
import { FieldInfo } from '@/components/FieldInfo';

export const Route = createFileRoute('/admin/users/create')({
  component: RouteComponent,
  loader: async () => fetchCreateUserInitialData(),
})

function RouteComponent() {
  const navigate = useNavigate();
  const notifications = useNotifications();
  const { roles } = Route.useLoaderData();
  const form = useForm({
    defaultValues: {
      name: '',
      email: '',
      role_id: roles.length > 0 ? roles.find(role => role.key === 'staff')?.id : '',
    },
    validators: {
      onChange: CreateUserData,
    },
    onSubmit: async (values) => {
      console.log('Submitting form with values:', values);
    }
  });

  // const googleLogin = async (credentialResponse: CredentialResponse) => {
  //   const userInfo: { email: string; name: string; email_verified: boolean } = jose.decodeJwt(credentialResponse.credential as string);

  //   loginAdminUser({
  //     data: userInfo
  //   }).then((res) => {
  //     if (res.status === 'SUCCESS') {
  //       navigate({ to: '/admin', replace: true });
  //     } else {
  //       notifications.addNotification({
  //         type: 'ERROR',
  //         message: res.error || 'Login failed. Please try again.',
  //       });
  //     }
  //   }).catch((err) => {
  //     notifications.addNotification({
  //       type: 'ERROR',
  //       message: 'Login failed. Please try again.',
  //     });
  //   });
  // }

  return (
    <Container>
      <Heading level={1} className='mt-12'>Create New User</Heading>
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
            // validators={{
            //   onChange: ({ value }) => {
            //     const result = CreateUserData.shape.name.safeParse(value);
            //     return result.success ? null : result.error.issues[0].message;
            //   }
            // }}
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
            // validators={{
            //   onChange: ({ value }) => {
            //     const result = CreateUserData.shape.email.safeParse(value);
            //     return result.success ? null : result.error.issues[0].message;
            //   }
            // }}
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
                      className='w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300'
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
        <div className='mt-4'>
          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
            children={([canSubmit, isSubmitting]) => (
              <button
                type='submit'
                disabled={!canSubmit || isSubmitting}
                className={`w-full bg-blue-500 text-white rounded px-4 py-2 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50`}
              >
                {isSubmitting ? 'Creating...' : 'Create User'}
              </button>
            )}
          />
        </div>
      </form>
    </Container>
  )
}
