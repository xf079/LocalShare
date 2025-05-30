import { createFileRoute, Outlet } from '@tanstack/react-router'

import Logo from '@/assets/logo.svg?react'
import { PageLoading } from '@/components/common/page-loading'
import { BackgroundLines } from '@/components/ui/background-lines'

export const Route = createFileRoute('/_authorize')({
  component: Authorize,
  pendingComponent: PageLoading,
})

function Authorize() {
  return (
    <BackgroundLines className="flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6 py-12">
        <a href="#" className="flex items-center gap-2 self-center font-medium">
          <div className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Logo className="size-7" />
          </div>
          <span className="text-xl font-bold">Local Share</span>
        </a>
        <Outlet />
      </div>
    </BackgroundLines>
  )
}
