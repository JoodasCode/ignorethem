"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plus, Search, MessageSquare, Clock, Trash2 } from "lucide-react"

interface ChatSession {
  id: string
  title: string
  lastMessage: string
  timestamp: Date
  phase: "discovery" | "requirements" | "recommendation" | "generation"
}

const mockChatHistory: ChatSession[] = [
  {
    id: "1",
    title: "SaaS Project Management Tool",
    lastMessage: "Generated Next.js + Supabase stack",
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    phase: "generation",
  },
  {
    id: "2",
    title: "E-commerce Platform",
    lastMessage: "Discussing payment integration options",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    phase: "requirements",
  },
  {
    id: "3",
    title: "Internal Dashboard",
    lastMessage: "What type of application are you building?",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    phase: "discovery",
  },
  {
    id: "4",
    title: "Mobile App Backend",
    lastMessage: "Generated Express + MongoDB stack",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
    phase: "generation",
  },
  {
    id: "5",
    title: "Blog Platform",
    lastMessage: "Reviewing content management options",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 days ago
    phase: "recommendation",
  },
]

function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`
  } else if (diffInMinutes < 1440) {
    return `${Math.floor(diffInMinutes / 60)}h ago`
  } else {
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }
}

function getPhaseColor(phase: string): string {
  switch (phase) {
    case "discovery":
      return "text-blue-600 dark:text-blue-400"
    case "requirements":
      return "text-amber-600 dark:text-amber-400"
    case "recommendation":
      return "text-purple-600 dark:text-purple-400"
    case "generation":
      return "text-green-600 dark:text-green-400"
    default:
      return "text-muted-foreground"
  }
}

export function ChatHistorySidebar() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedChat, setSelectedChat] = useState<string | null>(null)

  const filteredChats = mockChatHistory.filter(
    (chat) =>
      chat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const groupedChats = {
    today: filteredChats.filter((chat) => {
      const today = new Date()
      return chat.timestamp.toDateString() === today.toDateString()
    }),
    yesterday: filteredChats.filter((chat) => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      return chat.timestamp.toDateString() === yesterday.toDateString()
    }),
    older: filteredChats.filter((chat) => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      return chat.timestamp < yesterday
    }),
  }

  return (
    <div className="w-80 border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <Button className="w-full justify-start gap-2 mb-4" size="sm">
          <Plus className="h-4 w-4" />
          New Chat
        </Button>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Chat History */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {groupedChats.today.length > 0 && (
            <div className="mb-4">
              <h3 className="text-xs font-medium text-muted-foreground mb-2 px-2">Today</h3>
              {groupedChats.today.map((chat) => (
                <ChatHistoryItem
                  key={chat.id}
                  chat={chat}
                  isSelected={selectedChat === chat.id}
                  onClick={() => setSelectedChat(chat.id)}
                />
              ))}
            </div>
          )}

          {groupedChats.yesterday.length > 0 && (
            <div className="mb-4">
              <h3 className="text-xs font-medium text-muted-foreground mb-2 px-2">Yesterday</h3>
              {groupedChats.yesterday.map((chat) => (
                <ChatHistoryItem
                  key={chat.id}
                  chat={chat}
                  isSelected={selectedChat === chat.id}
                  onClick={() => setSelectedChat(chat.id)}
                />
              ))}
            </div>
          )}

          {groupedChats.older.length > 0 && (
            <div className="mb-4">
              <h3 className="text-xs font-medium text-muted-foreground mb-2 px-2">Previous 7 days</h3>
              {groupedChats.older.map((chat) => (
                <ChatHistoryItem
                  key={chat.id}
                  chat={chat}
                  isSelected={selectedChat === chat.id}
                  onClick={() => setSelectedChat(chat.id)}
                />
              ))}
            </div>
          )}

          {filteredChats.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No conversations found</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

interface ChatHistoryItemProps {
  chat: ChatSession
  isSelected: boolean
  onClick: () => void
}

function ChatHistoryItem({ chat, isSelected, onClick }: ChatHistoryItemProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className={`group relative p-3 rounded-lg cursor-pointer transition-colors mb-1 ${
        isSelected ? "bg-primary/10 border border-primary/20" : "hover:bg-muted/50"
      }`}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm truncate mb-1">{chat.title}</h4>
          <p className="text-xs text-muted-foreground truncate mb-2">{chat.lastMessage}</p>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-medium capitalize ${getPhaseColor(chat.phase)}`}>{chat.phase}</span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatRelativeTime(chat.timestamp)}
            </span>
          </div>
        </div>

        {isHovered && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation()
              // Handle delete
            }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  )
}
