import { useState } from 'react'
import { Bot, User, Copy, Check, Send } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import {
  ChatContainerRoot,
  ChatContainerContent,
  ChatContainerScrollAnchor,
} from '@/shared/ui/chat-container'
import {
  Message as MessageUI,
  MessageContent,
  MessageActions,
} from '@/shared/ui/message'
import { Avatar, AvatarFallback } from '@/shared/ui/avatar'
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputActions,
  PromptInputAction,
} from '@/shared/ui/prompt-input'
import { Loader } from '@/shared/ui/loader'
import { PromptSuggestion } from '@/shared/ui/prompt-suggestion'
import { SidebarTrigger } from '@/shared/ui/sidebar'
import { Separator } from '@/shared/ui/separator'
import { ModeToggle } from '@/shared/ui/mode-toggle'
import { ChatActionContext } from '@/features/chat/model/chatActionContext'
import type { Message } from '@/entities/chat'

interface ChatWindowProps {
  messages: Message[]
  isLoading: boolean
  onSendMessage: (content: string) => void
}

const SUGGESTIONS = [
  '피벗 테이블 만들어줘',
  '차트 예시 보여줘',
  '다이어그램 예시 보여줘',
  'TypeScript 타입 가드 설명해줘',
]

function CopyButton({ content }: { content: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(content)
    } catch {
      // fallback
      const textarea = document.createElement('textarea')
      textarea.value = content
      textarea.style.cssText = 'position:fixed;left:-9999px;top:-9999px'
      document.body.appendChild(textarea)
      textarea.focus()
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      type="button"
      title={copied ? '복사됨' : '복사'}
      className="inline-flex items-center justify-center h-8 w-8 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
      onClick={handleCopy}
    >
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
    </button>
  )
}

export function ChatWindow({ messages, isLoading, onSendMessage }: ChatWindowProps) {
  const [inputValue, setInputValue] = useState('')

  const handleSubmit = () => {
    if (!inputValue.trim() || isLoading) return
    onSendMessage(inputValue)
    setInputValue('')
  }

  const handleSuggestionClick = (suggestion: string) => {
    onSendMessage(suggestion)
  }

  const isEmpty = messages.length === 0

  return (
    <ChatActionContext.Provider value={{ onSendMessage }}>
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="text-sm font-medium">AI Chat</h1>
        <div className="ml-auto">
          <ModeToggle />
        </div>
      </header>

      {/* Messages */}
      <ChatContainerRoot className="relative flex-1 min-h-0">
        <ChatContainerContent className="mx-auto max-w-4xl gap-6 px-4 py-6">
          {isEmpty ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-6">
              <div className="flex flex-col items-center gap-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Bot className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-xl font-semibold">무엇을 도와드릴까요?</h2>
                <p className="text-sm text-muted-foreground">
                  아래 추천 질문을 선택하거나 직접 입력해 보세요.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((suggestion) => (
                  <PromptSuggestion
                    key={suggestion}
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    {suggestion}
                  </PromptSuggestion>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <div key={msg.id}>
                  {msg.role === 'user' ? (
                    <MessageUI className="flex-row-reverse">
                      <Avatar className="h-8 w-8 shrink-0 bg-primary text-primary-foreground">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          <User className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                      <MessageContent className="bg-primary text-primary-foreground">
                        {msg.content}
                      </MessageContent>
                    </MessageUI>
                  ) : (
                    <div className="flex flex-col gap-1">
                      <MessageUI>
                        <Avatar className="h-8 w-8 shrink-0 bg-secondary">
                          <AvatarFallback className="bg-secondary">
                            <Bot className="h-5 w-5" />
                          </AvatarFallback>
                        </Avatar>
                        <MessageContent markdown className="bg-secondary flex-1 min-w-0">
                          {msg.content}
                        </MessageContent>
                      </MessageUI>
                      <MessageActions className="ml-11">
                        <CopyButton content={msg.content} />
                      </MessageActions>
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <MessageUI>
                  <Avatar className="h-8 w-8 shrink-0 bg-secondary">
                    <AvatarFallback className="bg-secondary">
                      <Bot className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex items-center gap-3 rounded-lg bg-secondary px-4 py-3">
                    <Loader variant="dots" size="sm" />
                    <Loader variant="text-shimmer" size="sm" text="생각하는 중" />
                  </div>
                </MessageUI>
              )}
            </>
          )}
          <ChatContainerScrollAnchor />
        </ChatContainerContent>
      </ChatContainerRoot>

      {/* Input */}
      <div className="mx-auto w-full max-w-4xl px-4 pb-4">
        <PromptInput
          value={inputValue}
          onValueChange={setInputValue}
          isLoading={isLoading}
          onSubmit={handleSubmit}
        >
          <PromptInputTextarea placeholder="메시지를 입력하세요..." />
          <PromptInputActions className="justify-end px-2 pb-2">
            <PromptInputAction tooltip="전송">
              <Button
                variant="default"
                size="icon"
                className="h-8 w-8 rounded-full"
                disabled={!inputValue.trim() || isLoading}
                onClick={handleSubmit}
              >
                <Send className="h-4 w-4" />
              </Button>
            </PromptInputAction>
          </PromptInputActions>
        </PromptInput>
      </div>
    </div>
    </ChatActionContext.Provider>
  )
}
