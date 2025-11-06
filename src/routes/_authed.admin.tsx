import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authed/admin')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/admin"!</div>
}
