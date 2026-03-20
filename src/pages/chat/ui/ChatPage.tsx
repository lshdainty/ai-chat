import { SidebarProvider, SidebarInset } from '@/shared/ui/sidebar'
import { ChatSidebar } from '@/widgets/chat-sidebar'
import { ChatWindow } from '@/widgets/chat-window'
import { useConversations, useChatMessages } from '@/features/chat'

const ChatPage = () => {
  const {
    groups,
    activeId,
    activeConversation,
    setActiveId,
    createConversation,
    deleteConversation,
    addMessage,
  } = useConversations()

  const { isLoading, sendMessage } = useChatMessages({
    conversationId: activeId,
    onAddMessage: addMessage,
  })

  const handleSendMessage = (content: string) => {
    if (!activeId) {
      const newConv = createConversation()
      // setTimeout을 사용해 상태 업데이트 후 메시지 전송
      setTimeout(() => {
        sendMessageWithId(newConv.id, content)
      }, 0)
      return
    }
    sendMessage(content)
  }

  // 특정 conversationId로 직접 메시지 전송
  const sendMessageWithId = async (conversationId: string, content: string) => {
    const { chatApi } = await import('@/features/chat')
    const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

    const userMessage = {
      id: generateId(),
      role: 'user' as const,
      content: content.trim(),
      createdAt: new Date(),
    }
    addMessage(conversationId, userMessage)

    try {
      const response = await chatApi.sendMessage({
        message: content.trim(),
        conversationId,
      })
      const assistantMessage = {
        id: generateId(),
        role: 'assistant' as const,
        content: response.reply,
        createdAt: new Date(),
      }
      addMessage(conversationId, assistantMessage)
    } catch {
      const errorMessage = {
        id: generateId(),
        role: 'assistant' as const,
        content: '죄송합니다. 오류가 발생했습니다. 다시 시도해 주세요.',
        createdAt: new Date(),
      }
      addMessage(conversationId, errorMessage)
    }
  }

  return (
    <SidebarProvider>
      <ChatSidebar
        groups={groups}
        activeId={activeId}
        onSelect={setActiveId}
        onCreate={() => createConversation()}
        onDelete={deleteConversation}
      />
      <SidebarInset className="overflow-hidden">
        <ChatWindow
          messages={activeConversation?.messages ?? []}
          isLoading={isLoading}
          onSendMessage={handleSendMessage}
        />
      </SidebarInset>
    </SidebarProvider>
  )
}

export default ChatPage
