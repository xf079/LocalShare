import { SimpleRouteLoading } from '@/components/ui/route-loading'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import React from 'react'
import { routeTree } from './routeTree.gen'

// Create a new router instance
const router = createRouter({
  routeTree,
  defaultPendingComponent: () => <SimpleRouteLoading />,
  defaultPendingMinMs: 300, // 最小显示时间，避免闪烁
  defaultPendingMs: 1000, // 延迟显示时间
})

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

export const App: React.FC = () => {
  return <RouterProvider router={router} />
}
