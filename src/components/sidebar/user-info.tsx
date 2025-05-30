import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Settings } from 'lucide-react'

interface UserInfoProps {
  user: {
    name: string
    email: string
    avatar: string
    status: 'online' | 'offline'
    statusText: string
  }
}

export function UserInfo({ user }: UserInfoProps) {
  return (
    <div className="flex flex-row items-center gap-2.5 p-1.5 hover:bg-accent">
      <div className="relative">
        <Avatar className="h-10 w-10 relative">
          <AvatarImage src={user.avatar} alt={user.name} />
          <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div
          className={cn(
            'absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border border-background',
            {
              'bg-green-500': user.status === 'online',
              'bg-gray-400': user.status === 'offline',
            },
          )}
        />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{user.name}</p>
        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
      </div>

      <Button variant="ghost" size="sm">
        <Settings className="h-4 w-4" />
      </Button>
    </div>
  )
}
