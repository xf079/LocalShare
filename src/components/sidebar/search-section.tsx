import { Input } from '@/components/ui/input'
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
} from '@/components/ui/sidebar'
import { Search } from 'lucide-react'

interface SearchSectionProps {
  onSearchRooms?: (query: string) => void
  onSearchFriends?: (query: string) => void
}

export function SearchSection({ onSearchRooms, onSearchFriends }: SearchSectionProps) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>搜索</SidebarGroupLabel>
      <SidebarGroupContent>
        <div className="space-y-2 px-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索房间..."
              className="pl-9 h-8"
              onChange={(e) => onSearchRooms?.(e.target.value)}
            />
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索好友..."
              className="pl-9 h-8"
              onChange={(e) => onSearchFriends?.(e.target.value)}
            />
          </div>
        </div>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}