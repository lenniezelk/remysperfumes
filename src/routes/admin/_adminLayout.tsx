import ContainerNoOverflow from '@/components/ContainerNoOverflow'
import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/_adminLayout')({
    component: RouteComponent,
})

function RouteComponent() {
    return (
        <ContainerNoOverflow>
            <Outlet />
        </ContainerNoOverflow>
    )
}
