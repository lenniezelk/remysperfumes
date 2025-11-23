import Heading from '@/components/Heading';
import { Outlet, createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/admin/stock-batches')({
    component: RouteComponent,
});

function RouteComponent() {
    return (
        <>
            <Heading level={1}>Stock Batch Management</Heading>
            <Outlet />
        </>
    );
}
