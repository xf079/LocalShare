export const PageLoading = () => {
  return (
    <div className="fixed inset-0 z-50">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
      <span>加载中...</span>
    </div>
  )
}
