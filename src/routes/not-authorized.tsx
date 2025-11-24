import { createFileRoute } from '@tanstack/react-router'
import Container from '@/components/Container'
import Heading from '@/components/Heading'

export const Route = createFileRoute('/not-authorized')({
    component: RouteComponent,
})

function RouteComponent() {
    return <Container><Heading level={1}>You have no permissions to view this page.</Heading></Container>
}
