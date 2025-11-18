import Heading from '@/components/Heading'
import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/users')({
  component: RouteComponent,
});

function RouteComponent() {

  return (
    <>
      <Heading level={1} className='mt-12 mb-4'>
        User Management
      </Heading>
      <Outlet />
    </>
  )
}
