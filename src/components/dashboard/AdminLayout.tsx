import { useEffect, useState, type FC, type ReactNode } from 'react'
import { modelsBlueprint } from '@/utility/modelsBlueprint'
import { Link } from '@tanstack/react-router'
import Heading from '@/components/Heading'
import { getCurrentAdminUser } from '@/lib/auth/auth'
import { canViewDashboardCard } from '@/lib/permissions'

interface AdminLayoutProps {
  children: ReactNode
  currentPath: string // pass the current route path for active highlighting
}

const AdminLayout: FC<AdminLayoutProps> = ({ children, currentPath }) => {
  const [user, setUser] = useState<any>(null)
  useEffect(() => {
    const fetchUser = async () => {
      const session = await getCurrentAdminUser()
      const signedInUser = session.status === 'SUCCESS' ? session.data : null
      setUser(signedInUser)
    }
    fetchUser()
  }, [])
  const userRoleKey = user?.role?.key

  return (
    <div className="w-full overflow-x-auto flex">
      {/* Sidebar */}
      <aside className="shadow-md border-r border-gray-200 p-4">
        <Link to="/admin">
          <Heading level={3} className="text-brand mb-4">
            Dashboard
          </Heading>
        </Link>
        <nav className="space-y-1">
          {modelsBlueprint
            .filter((bluePrint) =>
              canViewDashboardCard(userRoleKey, bluePrint.roles),
            )
            .map((model) => {
              const Icon = model.icon
              const isActive = currentPath.startsWith(model.route)

              return (
                <Link
                  key={model.key}
                  to={model.route}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition
                  ${
                    isActive
                      ? 'bg-accent text-white shadow'
                      : 'text-gray-700 hover:bg-accent hover:text-white'
                  }
                `}
                >
                  <Icon className="w-5 h-5" />
                  {model.name}
                </Link>
              )
            })}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1">{children}</main>
    </div>
  )
}

export default AdminLayout
