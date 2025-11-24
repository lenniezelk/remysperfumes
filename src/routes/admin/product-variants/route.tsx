import { Outlet, createFileRoute } from '@tanstack/react-router';
import Heading from '@/components/Heading';

export const Route = createFileRoute('/admin/product-variants')({
    component: RouteComponent,
});

function RouteComponent() {
    return (
        <>
            <Heading level={1}>Product Variant Management</Heading>
            <Outlet />
        </>
    );
}
