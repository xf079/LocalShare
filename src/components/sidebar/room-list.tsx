import { Link } from '@tanstack/react-router'
import {
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { MessageSquare, Plus } from 'lucide-react'

interface Room {
  id: number
  name: string
  members: number
  lastMessage: string
}

interface RoomListProps {
  rooms: Room[]
  onCreateRoom?: () => void
}

export function RoomList({ rooms, onCreateRoom }: RoomListProps) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>我的房间</SidebarGroupLabel>
      <SidebarGroupAction onClick={onCreateRoom}>
        <Plus className="h-4 w-4" />
      </SidebarGroupAction>
      <SidebarGroupContent>
        <SidebarMenu>
          {rooms.map((room) => (
            <SidebarMenuItem key={room.id}>
              <SidebarMenuButton asChild>
                <Link
                  to="/room/$roomId"
                  params={{ roomId: room.id.toString() }}
                >
                  <MessageSquare className="h-4 w-4" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {room.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {room.members} 成员 · {room.lastMessage}
                    </div>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
