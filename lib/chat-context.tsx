"use client"

import { DataPart } from "@/ai/messages/data-parts"
import { useDataStateMapper } from "@/app/state"
import { type ChatUIMessage } from "@/components/chat/types"
import { Chat } from "@ai-sdk/react"
import { DataUIPart } from "ai"
import {
  createContext,
  useContext,
  useMemo,
  useRef,
  type ReactNode,
} from "react"
import { toast } from "sonner"
import { mutate } from "swr"

interface ChatContextValue {
  chat: Chat<ChatUIMessage>
  onFinishCallback?: (props: { message: ChatUIMessage }) => void
  setOnFinishCallback: (
    callback: (props: { message: ChatUIMessage }) => void
  ) => void
}

const ChatContext = createContext<ChatContextValue | undefined>(undefined)

export function ChatProvider({ children }: { children: ReactNode }) {
  const mapDataToState = useDataStateMapper()
  const mapDataToStateRef = useRef(mapDataToState)
  mapDataToStateRef.current = mapDataToState

  const onFinishCallbackRef = useRef<
    ((props: { message: ChatUIMessage }) => void) | undefined
  >(undefined)

  const chat = useMemo(
    () =>
      new Chat<ChatUIMessage>({
        onToolCall: () => mutate("/api/auth/info"),
        onData: (data: DataUIPart<DataPart>) => mapDataToStateRef.current(data),
        onError: (error) => {
          toast.error(`Communication error with the AI: ${error.message}`)
          console.error("Error sending message:", error)
        },
        onFinish: (props) => {
          console.log("🎯 Chat context onFinish called:", props)
          if (onFinishCallbackRef.current) {
            console.log("🎯 Calling registered onFinish callback")
            onFinishCallbackRef.current(props)
          }
        },
      }),
    []
  )

  const setOnFinishCallback = (
    callback: (props: { message: ChatUIMessage }) => void
  ) => {
    onFinishCallbackRef.current = callback
  }

  return (
    <ChatContext.Provider
      value={{
        chat,
        onFinishCallback: onFinishCallbackRef.current,
        setOnFinishCallback,
      }}
    >
      {children}
    </ChatContext.Provider>
  )
}

export function useSharedChatContext() {
  const context = useContext(ChatContext)
  if (!context) {
    throw new Error("useSharedChatContext must be used within a ChatProvider")
  }
  return context
}
