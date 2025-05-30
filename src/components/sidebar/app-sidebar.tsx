import { Sidebar, SidebarContent, SidebarHeader } from '@/components/ui/sidebar'
import { UserInfo } from './user-info'
import { QuickActions } from './quick-actions'
import { SearchSection } from './search-section'
import { RoomList } from './room-list'
import { FriendList } from './friend-list'
import { SidebarFooterSection } from './sidebar-footer'

interface User {
  name: string
  email: string
  avatar: string
  status: 'online' | 'offline'
  statusText: string
}

interface Room {
  id: number
  name: string
  members: number
  lastMessage: string
}

interface Friend {
  id: number
  name: string
  status: 'online' | 'offline'
  avatar: string
}

interface AppSidebarProps {
  user: User
  rooms: Room[]
  friends: Friend[]
  onCreateRoom?: () => void
  onAddFriend?: () => void
  onSearchRooms?: (query: string) => void
  onSearchFriends?: (query: string) => void
  onFriendClick?: (friend: Friend) => void
  onLogout?: () => void
}

export function AppSidebar({
  user,
  rooms,
  friends,
  onCreateRoom,
  onAddFriend,
  onSearchRooms,
  onSearchFriends,
  onFriendClick,
  onLogout,
}: AppSidebarProps) {
  return (
    <Sidebar variant="inset">
      {/* 用户信息区域 */}
      <SidebarHeader>
        <UserInfo user={user} />
      </SidebarHeader>

      <SidebarContent>
        {/* 快速操作 */}
        <QuickActions />

        {/* 我的房间 */}
        <RoomList rooms={rooms} onCreateRoom={onCreateRoom} />

        {/* 我的好友 */}
        <FriendList
          friends={friends}
          onAddFriend={onAddFriend}
          onFriendClick={onFriendClick}
        />
      </SidebarContent>

      {/* 底部退出按钮 */}
      <SidebarFooterSection onLogout={onLogout} />
    </Sidebar>
  )
}
