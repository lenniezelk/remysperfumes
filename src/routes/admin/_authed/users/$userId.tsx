import Container from '@/components/Container'
import Heading from '@/components/Heading'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/_authed/users/$userId')({
    component: RouteComponent,
})

function RouteComponent() {
    const { userId } = Route.useParams()

    return (
        <Container>
            <Heading level={1} className='mt-12 mb-4'>
                Edit User
            </Heading>
            <div>
                <p>User ID: {userId}</p>
                {/* Add your edit form here */}
            </div>
        </Container>
    )
}
