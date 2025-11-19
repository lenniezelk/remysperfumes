import { createMiddleware } from '@tanstack/react-start'
import { isAdminMiddleware } from './isAdmin'
import { canManageCategories } from '@/lib/permissions'
import { redirect } from '@tanstack/react-router'

export const canManageCategoriesMiddleware = createMiddleware({
  type: 'function',
})
  .middleware([isAdminMiddleware])
  .server(async ({ next, context }) => {
    const { user } = context

    if (!canManageCategories(user.role?.key)) {
      throw redirect({
        to: '/not-authorized',
        replace: true,
      })
    }

    return next({ context })
  })
