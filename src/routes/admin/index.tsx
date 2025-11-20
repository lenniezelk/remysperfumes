import AppLink from '@/components/AppLink'
import Heading from '@/components/Heading'
import { modelsBlueprint } from '@/utility/modelsBlueprint'
import { createFileRoute } from '@tanstack/react-router'
import { getCurrentAdminUser } from '@/lib/auth/auth'
import { canViewDashboardCard } from '@/lib/permissions'

export const Route = createFileRoute('/admin/')({
  loader: async () => {
    const session = await getCurrentAdminUser()
    const signedInUser = session.status === 'SUCCESS' ? session.data : null
    return {
      user: signedInUser,
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const context = Route.useRouteContext()
  const { user } = Route.useLoaderData()
  const userRoleKey = user?.role?.key

  return (
    <div className="p-8">
      <Heading level={1} className="mb-4 flex justify-between items-baseline">
        <span className="text-brand">Dashboard</span>
        <span className="text-accent text-sm">
          {' '}
          Welcome {context.user?.name}
        </span>
      </Heading>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {modelsBlueprint
          .filter((bluePrint) =>
            canViewDashboardCard(userRoleKey, bluePrint.roles),
          )
          .map((model) => {
            const Icon = model.icon

            return (
              <AppLink
                key={model.key}
                to={model.route}
                className="block p-6 bg-white shadow hover:shadow-lg transition rounded-xl border border-gray-100 no-underline hover:no-underline"
              >
                <div className="flex items-center gap-4">
                  <Icon className="w-10 h-10 text-brand" />
                  <div>
                    <Heading
                      level={4}
                      className="text-4xl text-accent font-semibold no-underline hover:no-underline"
                    >
                      {model.name}
                    </Heading>
                    <p className="text-gray-600 text-sm no-underline hover:no-underline">
                      {model.description}
                    </p>
                  </div>
                </div>
              </AppLink>
            )
          })}
      </div>
    </div>
  )
}
