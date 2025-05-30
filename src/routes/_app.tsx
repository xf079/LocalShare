import { createFileRoute, Outlet } from '@tanstack/react-router'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { AppSidebar, type User, type Room, type Friend } from '@/components/sidebar'

export const Route = createFileRoute('/_app')({
  component: App,
})

function App() {
  // 模拟用户数据
  const currentUser: User = {
    name: '张三',
    email: 'zhangsan@example.com',
    avatar: '/placeholder-avatar.jpg',
    status: 'online',
    statusText: '正在工作中'
  }

  // 模拟房间数据
  const rooms: Room[] = [
    { id: 1, name: '工作讨论', members: 5, lastMessage: '刚刚' },
    { id: 2, name: '项目协作', members: 8, lastMessage: '5分钟前' },
    { id: 3, name: '技术交流', members: 12, lastMessage: '1小时前' }
  ]

  // 模拟好友数据
  const friends: Friend[] = [
    { id: 1, name: '李四', status: 'online', avatar: '/placeholder-avatar.jpg' },
    { id: 2, name: '王五', status: 'offline', avatar: '/placeholder-avatar.jpg' },
    { id: 3, name: '赵六', status: 'online', avatar: '/placeholder-avatar.jpg' }
  ]

  // 事件处理函数
  const handleCreateRoom = () => {
    console.log('创建房间')
  }

  const handleAddFriend = () => {
    console.log('添加好友')
  }

  const handleSearchRooms = (query: string) => {
    console.log('搜索房间:', query)
  }

  const handleSearchFriends = (query: string) => {
    console.log('搜索好友:', query)
  }

  const handleFriendClick = (friend: Friend) => {
    console.log('点击好友:', friend)
  }

  const handleLogout = () => {
    console.log('退出登录')
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar
          user={currentUser}
          rooms={rooms}
          friends={friends}
          onCreateRoom={handleCreateRoom}
          onAddFriend={handleAddFriend}
          onSearchRooms={handleSearchRooms}
          onSearchFriends={handleSearchFriends}
          onFriendClick={handleFriendClick}
          onLogout={handleLogout}
        />

        <SidebarInset>
          {/* 顶部工具栏 */}
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <div className="flex-1" />
            {/* 这里可以添加其他顶部工具 */}
          </header>
          
          {/* 主内容区域 */}
          <div className="flex flex-1 flex-col gap-4 p-4">
            <Outlet />
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
