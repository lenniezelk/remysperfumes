import { createFileRoute } from '@tanstack/react-router'
import AppLink from '@/components/AppLink'
import Heading from '@/components/Heading'
import { modelsBlueprint } from '@/utility/modelsBlueprint'
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
  const { user } = Route.useLoaderData()
  const userRoleKey = user?.role?.key

  return (
    <div className="p-2">
      <Heading level={1} className="mb-8">
        Dashboard
      </Heading>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {modelsBlueprint
          .filter((bluePrint) =>
            canViewDashboardCard(userRoleKey, bluePrint.roles),
          )
          .map((model) => {
            const Icon = model.icon

            return (

              <div className="card card-side bg-white shadow-sm">
                <figure>
                  <div className="flex items-center justify-center ml-4">
                    <Icon className="w-10 h-10 text-brand" />
                  </div>
                </figure>
                <div className="card-body">
                  <div className="flex flex-col gap-2">
                    <AppLink
                      key={model.key}
                      to={model.route}
                      className='no-underline hover:underline'
                    >
                      <Heading
                        level={4}
                        className='card-title'
                      >
                        {model.name}
                      </Heading>
                    </AppLink>
                    <p className="text-gray-600 text-sm">
                      {model.description}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
      </div>
    </div>
  )
}
