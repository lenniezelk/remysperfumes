import { Outlet, createFileRoute, redirect, useLocation } from '@tanstack/react-router'
import { CircleUserRound, HomeIcon, MenuIcon } from 'lucide-react'
import Container from '@/components/Container'
import Logo from '@/assets/logo.svg';
import { getCurrentAdminUser } from '@/lib/auth/auth';
import AppLink from '@/components/AppLink';
import { modelsBlueprint } from '@/utility/modelsBlueprint';
import { canViewDashboardCard } from '@/lib/permissions';

export const Route = createFileRoute('/admin')({
    component: RouteComponent,
    beforeLoad: async () => {
        const user = await getCurrentAdminUser()

        if (user.status === 'SUCCESS') {
            return { user: user.data }
        }

        throw redirect({
            to: '/admin-login',
            replace: true,
        })
    },
})

function RouteComponent() {
    const location = useLocation();
    const { user } = Route.useRouteContext()
    const userRoleKey = user?.role?.key

    return (
        <div className="drawer lg:drawer-open">
            <input id="my-drawer-4" type="checkbox" className="drawer-toggle" />
            <div className="drawer-content">
                <Container>
                    <nav className="navbar mb-8">
                        <label htmlFor="my-drawer-4" className="btn btn-ghost btn-square lg:hidden">
                            <MenuIcon className="w-6 h-6" />
                        </label>

                        <div className="w-full flex justify-end gap-2">
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
                                        <p className="text-sm text-gray-500 font-bold">{user?.name}</p>
                                    </li>
                                    <li>
                                        <AppLink to="/admin/profile" className="text-lg">
                                            Profile
                                        </AppLink>
                                    </li>
                                    <li><AppLink to="/admin-logout" className="text-lg">Logout</AppLink></li>
                                </ul>
                            </div>
                        </div>
                    </nav>
                    <Outlet />
                </Container>
            </div>
            <div className="drawer-side">
                <label htmlFor="my-drawer-4" aria-label="close sidebar" className="drawer-overlay"></label>
                <div className="flex min-h-full flex-col items-start bg-base-200 w-64 p-4">
                    {/* Sidebar content here */}
                    <div className="flex items-center gap-2 mb-4">
                        <div className='w-16 h-16'>
                            <img
                                alt="Remi's Perfumes Admin"
                                src={Logo} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold">Remi's Perfumes</h2>
                            <p className="text-sm text-gray-500">Admin</p>
                        </div>
                    </div>
                    <ul className="menu w-full grow">
                        <li>
                            <AppLink to="/admin" className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition ${location.pathname === '/admin' ? 'bg-accent text-white shadow' : 'text-gray-700 hover:bg-accent hover:text-white'}`}>
                                <HomeIcon className="w-5 h-5" />
                                Dashboard
                            </AppLink>
                        </li>
                        {modelsBlueprint
                            .filter((bluePrint) =>
                                canViewDashboardCard(userRoleKey, bluePrint.roles),
                            )
                            .map((model) => {
                                const Icon = model.icon
                                const isActive = location.pathname.startsWith(model.route)

                                return (
                                    <li key={model.key}>
                                        <AppLink
                                            to={model.route}
                                            className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition
                                              ${isActive
                                                    ? 'bg-accent text-white shadow'
                                                    : 'text-gray-700 hover:bg-accent hover:text-white'
                                                }
                                            `}
                                        >
                                            <Icon className="w-5 h-5" />
                                            {model.name}
                                        </AppLink>
                                    </li>
                                )
                            })}
                    </ul>
                </div>
            </div>
        </div>
    )
}
