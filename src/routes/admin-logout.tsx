import { createFileRoute } from '@tanstack/react-router'
import { logoutAdminUser } from '@/lib/auth/auth'

export const Route = createFileRoute('/admin-logout')({
    component: RouteComponent,
    beforeLoad: async () => {
        await logoutAdminUser();
    }
})

function RouteComponent() {
    return <div>Logging You Out!</div>
}
