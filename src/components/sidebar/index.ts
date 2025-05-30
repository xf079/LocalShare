export { AppSidebar } from './app-sidebar'
export { UserInfo } from './user-info'
export { QuickActions } from './quick-actions'
export { SearchSection } from './search-section'
export { RoomList } from './room-list'
export { FriendList } from './friend-list'
export { SidebarFooterSection } from './sidebar-footer'

// 类型定义
export interface User {
  name: string
  email: string
  avatar: string
  status: 'online' | 'offline'
  statusText: string
}

export interface Room {
  id: number
  name: string
  members: number
  lastMessage: string
}

export interface Friend {
  id: number
  name: string
  status: 'online' | 'offline'
  avatar: string
}