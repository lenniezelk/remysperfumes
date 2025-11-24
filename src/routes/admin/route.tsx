import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { CircleUserRound } from 'lucide-react'
import Container from '@/components/Container'
import Logo from '@/assets/logo.svg';
import { getCurrentAdminUser } from '@/lib/auth/auth';
import AppLink from '@/components/AppLink';

export const Route = createFileRoute('/admin')({
    component: RouteComponent,
    beforeLoad: async ({ location }) => {
        const user = await getCurrentAdminUser()

        if (user.status === 'SUCCESS') {
            return { user: user.data }
        }

        throw redirect({
            to: '/admin-login',
            replace: true,
            search: { redirect: location.href },
        })
    },
})

function RouteComponent() {
    return (
        <Container>
            <div className="navbar mb-8">
                <div className="flex-1">
                    <div className='w-16 h-16'>
                        <AppLink to="/admin">
                            <img
                                alt="Remi's Perfumes Admin"
                                src={Logo} />
                        </AppLink>
                    </div>
                </div>
                <div className="flex gap-2">
                    <div className="dropdown dropdown-end">
                        <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar outline-0 border-0 hover:bg-white hover:outline-0">
                            <div className="w-10 rounded-full">
                                <CircleUserRound className="w-10 h-10 text-brand" />
                            </div>
                        </div>
                        <ul
                            tabIndex={-1}
                            className="menu menu-sm dropdown-content bg-white rounded-box z-1 mt-3 w-52 p-2 shadow">
                            <li>
                                <AppLink to="/admin/profile" className="justify-between">
                                    Profile
                                </AppLink>
                            </li>
                            <li><AppLink to="/admin-logout" className="justify-between">Logout</AppLink></li>
                        </ul>
                    </div>
                </div>
            </div>
            <Outlet />
        </Container>
    )
}
