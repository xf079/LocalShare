import { cn } from '@/lib/utils'
import React from 'react'
import { Progress } from './progress'
import { Skeleton } from './skeleton'

interface RouteLoadingProps {
  className?: string
  showProgress?: boolean
  showSkeleton?: boolean
  message?: string
}

export function RouteLoading({
  className,
  showProgress = true,
  showSkeleton = true,
  message = '页面加载中...',
}: RouteLoadingProps) {
  const [progress, setProgress] = React.useState(0)

  React.useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev
        return prev + Math.random() * 15
      })
    }, 100)

    return () => clearInterval(timer)
  }, [])

  return (
    <div
      className={cn(
        'flex min-h-screen flex-col items-center justify-center space-y-6 p-6',
        className,
      )}
    >
      {/* Loading Spinner */}
      <div className="relative">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
      </div>

      {/* Loading Message */}
      <div className="text-center space-y-2">
        <p className="text-lg font-medium text-foreground">{message}</p>
        <p className="text-sm text-muted-foreground">请稍候片刻</p>
      </div>

      {/* Progress Bar */}
      {showProgress && (
        <div className="w-full max-w-md space-y-2">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-center text-muted-foreground">
            {Math.round(progress)}%
          </p>
        </div>
      )}

      {/* Skeleton Content */}
      {showSkeleton && (
        <div className="w-full max-w-md space-y-3">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      )}
    </div>
  )
}

// 简化版本的 loading 组件
export function SimpleRouteLoading({ className }: { className?: string }) {
  return (
    <div
      className={cn('flex min-h-screen items-center justify-center', className)}
    >
      <div className="flex flex-col items-center space-y-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
        <p className="text-sm text-muted-foreground">加载中...</p>
      </div>
    </div>
  )
}
