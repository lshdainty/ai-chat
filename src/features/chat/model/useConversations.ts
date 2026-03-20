import { useState, useCallback, useEffect } from 'react'
import type { Conversation, Message } from '@/entities/chat'

const STORAGE_KEY = 'ai-chat-conversations'

function loadConversations(): Conversation[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    const parsed = JSON.parse(stored) as Conversation[]
    return parsed.map((c) => ({
      ...c,
      createdAt: new Date(c.createdAt),
      updatedAt: new Date(c.updatedAt),
      messages: c.messages.map((m) => ({
        ...m,
        createdAt: new Date(m.createdAt),
      })),
    }))
  } catch {
    return []
  }
}

function saveConversations(conversations: Conversation[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations))
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function generateTitle(firstMessage: string): string {
  const maxLength = 30
  const title = firstMessage.replace(/\n/g, ' ').trim()
  return title.length > maxLength ? title.slice(0, maxLength) + '...' : title
}

export interface ConversationGroup {
  label: string
  conversations: Conversation[]
}

function groupConversations(conversations: Conversation[]): ConversationGroup[] {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - 86400000)
  const last7Days = new Date(today.getTime() - 7 * 86400000)
  const last30Days = new Date(today.getTime() - 30 * 86400000)

  const groups: ConversationGroup[] = []
  const todayItems: Conversation[] = []
  const yesterdayItems: Conversation[] = []
  const last7Items: Conversation[] = []
  const last30Items: Conversation[] = []
  const olderItems: Conversation[] = []

  const sorted = [...conversations].sort(
    (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
  )

  for (const conv of sorted) {
    const date = conv.updatedAt
    if (date >= today) {
      todayItems.push(conv)
    } else if (date >= yesterday) {
      yesterdayItems.push(conv)
    } else if (date >= last7Days) {
      last7Items.push(conv)
    } else if (date >= last30Days) {
      last30Items.push(conv)
    } else {
      olderItems.push(conv)
    }
  }

  if (todayItems.length > 0) groups.push({ label: '오늘', conversations: todayItems })
  if (yesterdayItems.length > 0) groups.push({ label: '어제', conversations: yesterdayItems })
  if (last7Items.length > 0) groups.push({ label: '지난 7일', conversations: last7Items })
  if (last30Items.length > 0) groups.push({ label: '지난 30일', conversations: last30Items })
  if (olderItems.length > 0) groups.push({ label: '이전', conversations: olderItems })

  return groups
}

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>(loadConversations)
  const [activeId, setActiveId] = useState<string | null>(null)

  useEffect(() => {
    saveConversations(conversations)
  }, [conversations])

  const activeConversation = conversations.find((c) => c.id === activeId) ?? null

  const createConversation = useCallback((): Conversation => {
    const newConv: Conversation = {
      id: generateId(),
      title: '새 대화',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    setConversations((prev) => [newConv, ...prev])
    setActiveId(newConv.id)
    return newConv
  }, [])

  const deleteConversation = useCallback(
    (id: string) => {
      setConversations((prev) => prev.filter((c) => c.id !== id))
      if (activeId === id) {
        setActiveId(null)
      }
    },
    [activeId]
  )

  const addMessage = useCallback(
    (conversationId: string, message: Message) => {
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== conversationId) return c
          const updatedMessages = [...c.messages, message]
          const title =
            c.messages.length === 0 && message.role === 'user'
              ? generateTitle(message.content)
              : c.title
          return {
            ...c,
            title,
            messages: updatedMessages,
            updatedAt: new Date(),
          }
        })
      )
    },
    []
  )

  const groups = groupConversations(conversations)

  return {
    conversations,
    groups,
    activeId,
    activeConversation,
    setActiveId,
    createConversation,
    deleteConversation,
    addMessage,
  }
}
