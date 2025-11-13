import { getCurrentAdminUser } from '@/lib/auth/auth'
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/_authed')({
  beforeLoad: async ({ location }) => {
    const user = await getCurrentAdminUser()

    if (user.status === 'SUCCESS') {
      return { user: user.data }
    }

    throw redirect({
      to: '/admin/login',
      replace: true,
      search: { redirect: location.href },
    })
  },
})
