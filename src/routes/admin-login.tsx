import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form';
import { z } from 'zod';
import { getCurrentAdminUser, loginAdminUser } from '@/lib/server/auth/auth';
import { NotificationsList, useNotifications } from '@/components/notifications/Notification';
import { LoginAdminUserInput } from '@/lib/types';
import Heading from '@/components/Heading';
import { Input } from '@/components/Input';
import { FieldInfo } from '@/components/FieldInfo';
import Container from '@/components/Container';


export const Route = createFileRoute('/admin-login')({
  validateSearch: z.object({
    redirect: z.url().optional()
  }),
  component: RouteComponent,
  beforeLoad: async () => {
    const user = await getCurrentAdminUser();

    if (user.status === 'SUCCESS') {
      throw redirect({ to: '/admin', replace: true });
    }

    return {}
  }
})

function RouteComponent() {
  const notifications = useNotifications();
  const navigate = useNavigate();

  const form = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
    validators: {
      onChange: LoginAdminUserInput,
    },
    onSubmit: async (values) => {
      return loginAdminUser({ data: values.value }).then((res) => {
        if (res.status === 'SUCCESS') {
          navigate({ to: '/admin', replace: true });
        } else {
          notifications.addNotification({
            type: 'ERROR',
            message: res.error || 'Login failed. Please try again.',
          });
        }
      }).catch(() => {
        notifications.addNotification({
          type: 'ERROR',
          message: 'Login failed. Please try again.',
        });
      });
    }
  });

  return (
    <Container>
      <NotificationsList />
      <Heading level={1} className='mt-12'>Admin Login</Heading>
      <form
        className='mt-8 w-full max-w-md space-y-4'
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}>
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
                      placeholder='Enter your Email'
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
            name="password"
            children={
              (field) => {
                return (
                  <>
                    <Input
                      type='password'
                      name={field.name}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder='Enter your Password'
                      hasError={field.state.meta.isTouched && !field.state.meta.isValid}
                    />
                    <FieldInfo field={field} />
                  </>
                )
              }
            }
          />
        </div>
        {/* {!import.meta.env.DEV && <div className='mt-4'>
          <div
            ref={turnstileRef}
            className="cf-turnstile"
            data-sitekey={CLOUDFLARE_TURNSTILE_SITEKEY}
            data-callback="onTurnstileCallback"
            data-error-callback="onTurnstileError"
            data-expired-callback="onTurnstileExpired"
          />
        </div>} */}
        <div className='mt-4'>
          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
            children={([canSubmit, isSubmitting]) => (
              <button
                type='submit'
                disabled={!canSubmit || isSubmitting}
                className={`btn bg-primary text-white rounded px-4 py-2 hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50`}
              >
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </button>
            )}
          />
        </div>
      </form>
    </Container>
  )
}
