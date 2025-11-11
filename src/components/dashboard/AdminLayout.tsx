import type { FC, ReactNode } from 'react'
import { modelsBlueprint } from '@/utility/modelsBlueprint'
import { Link } from '@tanstack/react-router'
import Heading from '@/components/Heading'

interface AdminLayoutProps {
  children: ReactNode
  currentPath: string // pass the current route path for active highlighting
}

const AdminLayout: FC<AdminLayoutProps> = ({ children, currentPath }) => {
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md border-r border-gray-200 p-4">
        <Link to="/admin">
          <Heading level={3} className="text-brand">
            Dashboard
          </Heading>
        </Link>
        "
        <nav className="space-y-1">
          {modelsBlueprint.map((model) => {
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
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  )
}

export default AdminLayout
