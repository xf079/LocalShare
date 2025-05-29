import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authorize/forgot-password')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_authorize/forgot-password"!</div>
}
