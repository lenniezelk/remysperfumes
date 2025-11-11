//import { getCurrentAdminUser } from '@/lib/auth/auth';
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authed')({
  beforeLoad: async () => {
    const user = await getCurrentAdminUser();

    if (user.status === 'SUCCESS') {
      return { user: user.data };
    }

    throw redirect({ to: '/admin/login' });
  },
});
