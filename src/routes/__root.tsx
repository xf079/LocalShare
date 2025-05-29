import { PageLoading } from '@/components/common/page-loading'
import { createRootRoute, Outlet, redirect } from '@tanstack/react-router'
import React from 'react'

const TanStackRouteDevtools = import.meta.env.PROD
  ? () => null
  : React.lazy(() =>
      import('@tanstack/router-devtools').then((res) => ({
        default: res.TanStackRouterDevtools,
      })),
    )

export const Route = createRootRoute({
  beforeLoad: () => {
    // 如果当前路径是根路径，则重定向到 vault
    if (window.location.pathname === '/') {
      throw redirect({
        to: '/sign-in',
      })
    }
  },
  component: RootComponent,
  pendingComponent: PageLoading,
})

function RootComponent() {
  return (
    <>
      <Outlet />
      <TanStackRouteDevtools />
    </>
  )
}
