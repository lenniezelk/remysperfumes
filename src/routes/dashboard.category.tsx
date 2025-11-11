import { createFileRoute } from '@tanstack/react-router'
import { useLocation } from '@tanstack/react-router'
import AdminLayout from '@/components/dashboard/AdminLayout'

export const Route = createFileRoute('/dashboard/category')({
  component: CategoryPage,
})

function CategoryPage() {
  const location = useLocation()
  return (
    <AdminLayout currentPath={location.pathname}>
      <div>
        <h1 className="text-2xl font-bold mb-4">Categories</h1>
        <p className="text-gray-600">List view will go here...</p>
      </div>
    </AdminLayout>
  )
}
