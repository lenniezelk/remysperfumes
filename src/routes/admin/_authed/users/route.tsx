import Container from '@/components/Container'
import Heading from '@/components/Heading'
import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/_authed/users')({
    component: RouteComponent,
})

function RouteComponent() {

    return (
        <Container>
            <Heading level={1} className='mt-12 mb-4'>
                User Management
            </Heading>
            <Outlet />
        </Container>
    )
}
