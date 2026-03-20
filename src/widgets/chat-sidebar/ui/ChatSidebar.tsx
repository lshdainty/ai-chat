import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuAction,
  SidebarRail,
} from '@/shared/ui/sidebar'
import { Button } from '@/shared/ui/button'
import { MessageSquarePlus, Trash2 } from 'lucide-react'
import type { Conversation } from '@/entities/chat'
import type { ConversationGroup } from '@/features/chat'

interface ChatSidebarProps {
  groups: ConversationGroup[]
  activeId: string | null
  onSelect: (id: string) => void
  onCreate: () => void
  onDelete: (id: string) => void
}

export function ChatSidebar({
  groups,
  activeId,
  onSelect,
  onCreate,
  onDelete,
}: ChatSidebarProps) {
  return (
    <Sidebar>
      <SidebarHeader className="p-3">
        <Button
          onClick={onCreate}
          className="w-full justify-start gap-2"
          variant="outline"
        >
          <MessageSquarePlus className="h-4 w-4" />
          새 대화
        </Button>
      </SidebarHeader>

      <SidebarContent>
        {groups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarMenu>
              {group.conversations.map((conv: Conversation) => (
                <SidebarMenuItem key={conv.id}>
                  <SidebarMenuButton
                    isActive={conv.id === activeId}
                    onClick={() => onSelect(conv.id)}
                    className="truncate"
                  >
                    <span className="truncate">{conv.title}</span>
                  </SidebarMenuButton>
                  <SidebarMenuAction
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete(conv.id)
                    }}
                    className="opacity-0 group-hover/menu-item:opacity-100"
                  >
                    <Trash2 className="h-4 w-4" />
                  </SidebarMenuAction>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  )
}
