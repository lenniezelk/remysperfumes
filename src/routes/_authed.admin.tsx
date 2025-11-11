import { createFileRoute, redirect } from '@tanstack/react-router'
import { Link } from '@tanstack/react-router'
import { getCurrentAdminUser } from '@/lib/auth/auth'
import { modelsBlueprint } from '@/utility/modelsBlueprint'
import ContainerNoOverflow from '@/components/ContainerNoOverflow'
import Heading from '@/components/Heading'

export const Route = createFileRoute('/_authed/admin')({
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
  component: RouteComponent,
})

function RouteComponent() {
  const { user } = Route.useRouteContext()
  return (
    <ContainerNoOverflow>
      <div className="p-8">
        <Heading level={1} className="mb-4 flex justify-between items-baseline">
          <span className="text-brand">Dashboard</span>
          <span className="text-accent text-sm"> Welcome {user?.name}</span>
        </Heading>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {modelsBlueprint.map((model) => {
            const Icon = model.icon

            return (
              <Link
                key={model.key}
                to={model.route}
                className="block p-6 bg-white shadow hover:shadow-lg transition rounded-xl border border-gray-100"
              >
                <div className="flex items-center gap-4">
                  <Icon className="w-10 h-10 text-brand" />
                  <div>
                    <h2 className="text-xl text-accent font-semibold">
                      {model.name}
                    </h2>
                    <p className="text-gray-600 text-sm">{model.description}</p>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </ContainerNoOverflow>
  )
}
