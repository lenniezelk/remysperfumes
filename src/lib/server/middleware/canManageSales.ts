import { createMiddleware } from '@tanstack/react-start'
import { redirect } from '@tanstack/react-router'
import { isAdminMiddleware } from './isAdmin'
import { canManageSales } from '@/lib/permissions'

export const canManageSalesMiddleware = createMiddleware({
  type: 'function',
})
  .middleware([isAdminMiddleware])
  .server(async ({ next, context }) => {
    const { user } = context

    if (!canManageSales(user.role?.key)) {
      throw redirect({
        to: '/not-authorized',
        replace: true,
      })
    }

    return next({ context })
  })
