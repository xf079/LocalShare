import { PageLoading } from '@/components/common/page-loading'
import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Send,
  Phone,
  Video,
  MoreVertical,
  Users,
  Settings,
  Paperclip,
  Smile
} from 'lucide-react'
import { useState } from 'react'

export const Route = createFileRoute('/_app/room/$roomId')({  
  component: RouteComponent,
  pendingComponent: PageLoading,
})

function RouteComponent() {
  const { roomId } = Route.useParams()
  const [message, setMessage] = useState('')

  // 模拟房间数据
  const roomData = {
    id: roomId,
    name: '工作讨论',
    description: '团队日常工作交流群',
    members: [
      { id: 1, name: '张三', avatar: '/placeholder-avatar.jpg', status: 'online' },
      { id: 2, name: '李四', avatar: '/placeholder-avatar.jpg', status: 'online' },
      { id: 3, name: '王五', avatar: '/placeholder-avatar.jpg', status: 'offline' },
      { id: 4, name: '赵六', avatar: '/placeholder-avatar.jpg', status: 'online' }
    ],
    messages: [
      {
        id: 1,
        sender: '张三',
        avatar: '/placeholder-avatar.jpg',
        content: '大家好，今天的会议安排在下午2点',
        timestamp: '14:30',
        isOwn: false
      },
      {
        id: 2,
        sender: '李四',
        avatar: '/placeholder-avatar.jpg',
        content: '收到，我会准时参加',
        timestamp: '14:32',
        isOwn: false
      },
      {
        id: 3,
        sender: '我',
        avatar: '/placeholder-avatar.jpg',
        content: '好的，我也会参加',
        timestamp: '14:35',
        isOwn: true
      }
    ]
  }

  const handleSendMessage = () => {
    if (message.trim()) {
      console.log('发送消息:', message)
      setMessage('')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* 房间头部 */}
      <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">{roomData.name}</h1>
              <p className="text-sm text-muted-foreground">
                {roomData.members.filter(m => m.status === 'online').length} 人在线 · 共 {roomData.members.length} 人
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm">
            <Phone className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Video className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* 消息区域 */}
        <div className="flex-1 flex flex-col">
          {/* 消息列表 */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {roomData.messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-start space-x-3 ${msg.isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}
              >
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarImage src={msg.avatar} alt={msg.sender} />
                  <AvatarFallback>{msg.sender.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className={`flex flex-col ${msg.isOwn ? 'items-end' : 'items-start'} max-w-[70%]`}>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-sm font-medium">{msg.sender}</span>
                    <span className="text-xs text-muted-foreground">{msg.timestamp}</span>
                  </div>
                  <div
                    className={`rounded-lg px-3 py-2 text-sm ${
                      msg.isOwn
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 消息输入区域 */}
          <div className="border-t p-4">
            <div className="flex items-end space-x-2">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <Button variant="ghost" size="sm">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Smile className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-end space-x-2">
                  <Input
                    placeholder="输入消息..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-1"
                  />
                  <Button onClick={handleSendMessage} disabled={!message.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 成员列表侧边栏 */}
        <div className="w-64 border-l bg-muted/30">
          <Card className="h-full border-0 rounded-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">成员列表</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {roomData.members.map((member) => (
                <div key={member.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50">
                  <div className="relative">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={member.avatar} alt={member.name} />
                      <AvatarFallback className="text-xs">{member.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div
                      className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background ${
                        member.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                      }`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{member.name}</p>
                    <div className="flex items-center space-x-1">
                      <Badge
                        variant={member.status === 'online' ? 'default' : 'secondary'}
                        className="text-xs px-1.5 py-0.5"
                      >
                        {member.status === 'online' ? '在线' : '离线'}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}