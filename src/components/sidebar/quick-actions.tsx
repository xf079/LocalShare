import { Button } from '@/components/ui/button'
import { SquareActivityIcon ,Search} from 'lucide-react'

interface QuickActionsProps {
  onCreateRoom?: () => void
  onAddFriend?: () => void
}

export function QuickActions() {
  return (
    <div className='flex flex-row justify-between items-center gap-2.5'>

    <Button className='flex-1'>
      <SquareActivityIcon />
      <span>Quick Create</span>
    </Button>
    <Button variant='outline'>
      <Search />
    </Button>
    </div>
  )
}
