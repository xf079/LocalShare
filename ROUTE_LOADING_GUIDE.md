# 路由 Loading 状态指南

## 概述

已为项目添加了完整的路由切换 loading 状态，提供更好的用户体验。当用户在不同页面间切换时，会显示相应的加载动画和骨架屏。

## 已实现的功能

### 1. 全局 Loading 配置

- ✅ 在 `App.tsx` 中配置了全局的 pending 组件
- ✅ 设置了合理的延迟时间，避免快速切换时的闪烁
- ✅ 最小显示时间 300ms，延迟显示时间 1000ms

### 2. 根路由 Loading

- ✅ `__root.tsx` - 全局路由 loading 状态
- ✅ 使用 `RouteLoading` 组件，包含进度条和骨架屏

### 3. 布局路由 Loading

- ✅ `_authorize.tsx` - 认证页面布局的专用 loading
- ✅ 匹配认证页面的设计风格和布局

### 4. 页面路由 Loading

- ✅ `sign-in.tsx` - 登录页面的骨架屏 loading
- ✅ `room/index.tsx` - 房间页面的简单 loading

## Loading 组件说明

### RouteLoading (完整版)

位置：`src/components/ui/route-loading.tsx`

特性：

- 旋转加载动画
- 进度条显示
- 骨架屏内容
- 自定义消息
- 响应式设计

```tsx
<RouteLoading
  message="正在加载页面..."
  showProgress={true}
  showSkeleton={true}
/>
```

### SimpleRouteLoading (简化版)

特性：

- 简单的旋转动画
- 加载文字提示
- 轻量级设计

```tsx
<SimpleRouteLoading className="min-h-[50vh]" />
```

## 配置选项

### 路由级别配置

每个路由都可以配置自己的 `pendingComponent`：

```tsx
export const Route = createFileRoute('/your-route')({
  component: YourComponent,
  pendingComponent: YourLoadingComponent, // 自定义 loading
})
```

### 全局配置

在 `App.tsx` 中的路由器配置：

```tsx
const router = createRouter({
  routeTree,
  defaultPendingComponent: () => <SimpleRouteLoading />,
  defaultPendingMinMs: 300, // 最小显示时间
  defaultPendingMs: 1000, // 延迟显示时间
})
```

## 最佳实践

### 1. 选择合适的 Loading 组件

- **全页面路由**：使用 `RouteLoading`
- **简单页面**：使用 `SimpleRouteLoading`
- **特殊布局**：创建自定义 loading 组件

### 2. 匹配设计风格

- Loading 组件应该匹配目标页面的布局和风格
- 使用相同的颜色主题和间距
- 保持一致的用户体验

### 3. 性能考虑

- 设置合理的延迟时间，避免快速切换时的闪烁
- 对于快速加载的页面，可以增加 `defaultPendingMs`
- 使用轻量级的 loading 组件

## 自定义 Loading 组件

### 创建自定义组件

```tsx
function CustomLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center space-y-4">
        <div className="animate-spin h-8 w-8 border-4 border-primary/20 border-t-primary rounded-full mx-auto" />
        <p className="text-muted-foreground">自定义加载中...</p>
      </div>
    </div>
  )
}
```

### 应用到路由

```tsx
export const Route = createFileRoute('/custom-route')({
  component: CustomComponent,
  pendingComponent: CustomLoading,
})
```

## 调试和测试

### 模拟慢速加载

可以在路由组件中添加延迟来测试 loading 效果：

```tsx
export const Route = createFileRoute('/test')({
  loader: async () => {
    // 模拟 2 秒加载时间
    await new Promise((resolve) => setTimeout(resolve, 2000))
    return {}
  },
  component: TestComponent,
  pendingComponent: TestLoading,
})
```

### 开发者工具

- 使用浏览器开发者工具的网络面板模拟慢速网络
- 观察 loading 状态的显示和隐藏时机
- 确保 loading 动画流畅且不闪烁

## 注意事项

1. **避免过度使用**：不是所有路由都需要复杂的 loading 状态
2. **保持一致性**：同类型的页面应使用相似的 loading 风格
3. **响应式设计**：确保 loading 组件在不同屏幕尺寸下正常显示
4. **无障碍访问**：为 loading 状态添加适当的 aria 标签

## 扩展功能

未来可以考虑添加：

- 错误状态的 loading 组件
- 带有取消功能的 loading
- 更丰富的动画效果
- 主题切换支持
