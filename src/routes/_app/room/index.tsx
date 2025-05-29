import { PageLoading } from '@/components/common/page-loading'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/room/')({
  component: RouteComponent,
  pendingComponent: PageLoading,
})

function RouteComponent() {
  return <div>Hello "/_app/room/"!</div>
}
