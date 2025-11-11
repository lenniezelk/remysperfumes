import { createFileRoute } from '@tanstack/react-router'
import { useLocation } from '@tanstack/react-router'
import AdminLayout from '@/components/dashboard/AdminLayout'

export const Route = createFileRoute('/dashboard/products')({
  component: ProductsPage,
})

function ProductsPage() {
  const location = useLocation()
  return (
    <AdminLayout currentPath={location.pathname}>
      <div>
        <div className="flex justify-between">
          <h1 className="text-2xl font-bold mb-4 text-brand">Products</h1>
          <button className="bg-brand text-white px-6 py-3 rounded-full text-lg font-medium mb-8 shadow-lg">
            Add New
          </button>
        </div>
        <p className="text-gray-600">List view will go here...</p>
      </div>
    </AdminLayout>
  )
}
