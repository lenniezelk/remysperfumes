import { getCurrentAdminUser } from '@/lib/auth/auth';
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_authed')({
  component: RouteComponent,
  beforeLoad: async () => {
    const user = await getCurrentAdminUser();

    if (user.status === 'SUCCESS') {
      return { user: user.data };
    }

    throw redirect({ to: '/admin/login' });
  },
});

function RouteComponent() {
  return <div>Hello "/_authed"!</div>;
}
