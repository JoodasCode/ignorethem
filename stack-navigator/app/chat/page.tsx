import { Navigation } from "@/components/navigation"
import { ChatInterface } from "@/components/chat-interface"
import { ChatHistorySidebar } from "@/components/chat-history-sidebar"

export default function ChatPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <div className="flex-1 flex">
        <ChatHistorySidebar />
        <div className="flex-1">
          <ChatInterface />
        </div>
      </div>
    </div>
  )
}
