import { Outlet, createFileRoute } from '@tanstack/react-router'
import Heading from '@/components/Heading'

export const Route = createFileRoute('/admin/manufacturers')({
    component: RouteComponent,
})

function RouteComponent() {
    return <>
        <Heading level={1} className='mt-12 mb-4'>
            Manufacturer Management
        </Heading>
        <Outlet />
    </>
}
