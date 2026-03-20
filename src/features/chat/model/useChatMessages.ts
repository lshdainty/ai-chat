import { useState, useCallback } from 'react'
import type { Message } from '@/entities/chat'
import { chatApi } from '../api/chatApi'

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

interface UseChatMessagesOptions {
  conversationId: string | null
  onAddMessage: (conversationId: string, message: Message) => void
}

export function useChatMessages({ conversationId, onAddMessage }: UseChatMessagesOptions) {
  const [isLoading, setIsLoading] = useState(false)

  const sendMessage = useCallback(
    async (content: string) => {
      if (!conversationId || !content.trim()) return

      const userMessage: Message = {
        id: generateId(),
        role: 'user',
        content: content.trim(),
        createdAt: new Date(),
      }

      onAddMessage(conversationId, userMessage)
      setIsLoading(true)

      try {
        const response = await chatApi.sendMessage({
          message: content.trim(),
          conversationId,
        })

        const assistantMessage: Message = {
          id: generateId(),
          role: 'assistant',
          content: response.reply,
          createdAt: new Date(),
        }

        onAddMessage(conversationId, assistantMessage)
      } catch {
        const errorMessage: Message = {
          id: generateId(),
          role: 'assistant',
          content: '죄송합니다. 오류가 발생했습니다. 다시 시도해 주세요.',
          createdAt: new Date(),
        }
        onAddMessage(conversationId, errorMessage)
      } finally {
        setIsLoading(false)
      }
    },
    [conversationId, onAddMessage]
  )

  return {
    isLoading,
    sendMessage,
  }
}
