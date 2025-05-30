import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { UserPlus } from 'lucide-react'

interface Friend {
  id: number
  name: string
  status: 'online' | 'offline'
  avatar: string
}

interface FriendListProps {
  friends: Friend[]
  onAddFriend?: () => void
  onFriendClick?: (friend: Friend) => void
}

export function FriendList({ friends, onAddFriend, onFriendClick }: FriendListProps) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>我的好友</SidebarGroupLabel>
      <SidebarGroupAction onClick={onAddFriend}>
        <UserPlus className="h-4 w-4" />
      </SidebarGroupAction>
      <SidebarGroupContent>
        <SidebarMenu>
          {friends.map((friend) => (
            <SidebarMenuItem key={friend.id}>
              <SidebarMenuButton onClick={() => onFriendClick?.(friend)}>
                <div className="relative flex-shrink-0">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={friend.avatar} alt={friend.name} />
                    <AvatarFallback className="text-xs">
                      {friend.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={`absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-background ${
                      friend.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                    }`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{friend.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {friend.status === 'online' ? '在线' : '离线'}
                  </div>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}