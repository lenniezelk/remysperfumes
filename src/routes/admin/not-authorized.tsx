import ContainerNoOverflow from '@/components/ContainerNoOverflow'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/not-authorized')({
    component: RouteComponent,
})

function RouteComponent() {
    return <ContainerNoOverflow>
        <h1>You have no permissions to view this page.</h1>
    </ContainerNoOverflow>
}
