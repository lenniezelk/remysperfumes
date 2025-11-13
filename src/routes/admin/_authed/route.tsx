import { createFileRoute } from '@tanstack/react-router'
import { Link } from '@tanstack/react-router'
import { modelsBlueprint } from '@/utility/modelsBlueprint'
import ContainerNoOverflow from '@/components/ContainerNoOverflow'
import Heading from '@/components/Heading'

export const Route = createFileRoute('/admin/_authed')({
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
                    <Heading
                      level={4}
                      className="text-4xl text-accent font-semibold"
                    >
                      {model.name}
                    </Heading>
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
