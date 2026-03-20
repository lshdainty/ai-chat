import { createContext, useContext } from 'react'

interface ChatActionContextValue {
  onSendMessage: (content: string) => void
}

export const ChatActionContext = createContext<ChatActionContextValue | null>(null)

export function useChatAction() {
  const context = useContext(ChatActionContext)
  if (!context) {
    throw new Error('useChatAction must be used within ChatActionContext.Provider')
  }
  return context
}
