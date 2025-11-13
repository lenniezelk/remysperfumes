import Container from '@/components/Container'
import Heading from '@/components/Heading'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/not-authorized')({
    component: RouteComponent,
})

function RouteComponent() {
    return <Container><Heading level={1}>You have no permissions to view this page.</Heading></Container>
}
