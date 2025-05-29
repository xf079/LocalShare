import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authorize/sign-up')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_authorize/sign-up"!</div>
}
