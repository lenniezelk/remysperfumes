import { createFileRoute, useLocation } from '@tanstack/react-router'
import Heading from '@/components/Heading'
import AdminLayout from '@/components/dashboard/AdminLayout'
import ContainerNoOverflow from '@/components/ContainerNoOverflow'

export const Route = createFileRoute('/admin/_authed/products')({
  component: ProductsPage,
})

function ProductsPage() {
  const location = useLocation()
  return (
    <AdminLayout currentPath={location.pathname}>
      <ContainerNoOverflow>
        <div className="w-[-webkit-fill-available] h-[-webkit-fill-available] p-6">
          <div className="flex justify-between">
            <Heading level={4} className="text-2xl font-bold mb-4 text-brand">
              Products
            </Heading>
            <button className="bg-brand text-white px-6 py-3 rounded-full text-lg font-medium mb-8 shadow-lg">
              Add New
            </button>
          </div>
          <p className="text-gray-600">List view will go here...</p>
        </div>
      </ContainerNoOverflow>
    </AdminLayout>
  )
}
