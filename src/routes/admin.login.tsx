import { getCurrentAdminUser, loginAdminUser } from '@/lib/auth/auth';
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { useNotifications } from '@/components/notifications/Notification';
import { useForm } from '@tanstack/react-form';
import { LoginAdminUserInput } from '@/lib/types';
import Container from '@/components/Container';
import Heading from '@/components/Heading';
import { Input } from '@/components/Input';
import { FieldInfo } from '@/components/FieldInfo';
import { useEnvVars } from '@/components/EnvVars';
import { useState, useEffect, useRef } from 'react';


export const Route = createFileRoute('/admin/login')({
  component: RouteComponent,
  beforeLoad: async () => {
    const user = await getCurrentAdminUser();

    if (user.status === 'SUCCESS') {
      throw redirect({ to: '/admin' });
    }

    return {}
  }
})

function RouteComponent() {
  const [isTurnstileReady, setIsTurnstileReady] = useState(import.meta.env.DEV);
  const turnstileRef = useRef<HTMLDivElement>(null);
  const notifications = useNotifications();
  const navigate = useNavigate();
  const { CLOUDFLARE_TURNSTILE_SECRET } = useEnvVars();

  useEffect(() => {
    // Define callback functions in the global scope for Turnstile
    (window as any).onTurnstileCallback = () => setIsTurnstileReady(true);
    (window as any).onTurnstileError = () => setIsTurnstileReady(false);
    (window as any).onTurnstileExpired = () => setIsTurnstileReady(false);
  }, []);

  const form = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
    validators: {
      onChange: LoginAdminUserInput,
    },
    onSubmit: async (values) => {
      loginAdminUser({ data: values.value }).then((res) => {
        if (res.status === 'SUCCESS') {
          navigate({ to: '/admin', replace: true });
        } else {
          notifications.addNotification({
            type: 'ERROR',
            message: res.error || 'Login failed. Please try again.',
          });
        }
      }).catch((err) => {
        notifications.addNotification({
          type: 'ERROR',
          message: 'Login failed. Please try again.',
        });
      });
    }
  });

  return (
    <Container>
      <Heading level={1} className='mt-12'>Login</Heading>
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
        {!import.meta.env.DEV && <div className='mt-4'>
          <div
            ref={turnstileRef}
            className="cf-turnstile"
            data-sitekey={CLOUDFLARE_TURNSTILE_SECRET}
            data-callback="onTurnstileCallback"
            data-error-callback="onTurnstileError"
            data-expired-callback="onTurnstileExpired"
          />
        </div>}
        <div className='mt-4'>
          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
            children={([canSubmit, isSubmitting]) => (
              <button
                type='submit'
                disabled={!canSubmit || isSubmitting || !isTurnstileReady}
                className={`w-full bg-blue-500 text-white rounded px-4 py-2 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50`}
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
