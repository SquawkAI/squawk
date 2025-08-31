"use client";

import React, { useEffect, useRef } from "react";
import Image from "next/image";
import { Plus, PaperPlaneTilt } from "@phosphor-icons/react";

// Mock messages for demonstration
const mockMessages = [
  {
    role: "assistant" as const,
    content: "Hi! I'm your AI teaching assistant. Ask me anything about your course materials, and I'll help you understand the concepts better."
  },
  {
    role: "user" as const,
    content: "Can you explain the concept of machine learning?"
  },
  {
    role: "assistant" as const,
    content: "Machine learning is a subset of artificial intelligence that enables computers to learn and improve from experience without being explicitly programmed. It involves algorithms that can identify patterns in data and make predictions or decisions.\n\nThere are three main types:\n• <strong>Supervised Learning</strong>: Learning from labeled examples\n• <strong>Unsupervised Learning</strong>: Finding patterns in unlabeled data\n• <strong>Reinforcement Learning</strong>: Learning through trial and error\n\nWould you like me to explain any of these in more detail?"
  },
  {
    role: "user" as const,
    content: "Tell me more about supervised learning"
  }
];

// Message component
const MiniMessage: React.FC<{ role: "user" | "assistant"; content: string }> = ({ role, content }) => {
  const isUser = role === "user";

  return (
    <div className={`flex items-start gap-3 ${isUser ? "justify-end" : ""}`}>
      <div className={`rounded-2xl px-4 py-2 text-sm leading-relaxed max-w-[85%] ${isUser ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
        <div className="whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: content }} />
      </div>
    </div>
  );
};

// Miniature header component
const MiniHeader: React.FC = () => (
  <header className="border-b bg-background/80 backdrop-blur">
    <div className="flex items-center justify-between max-w-5xl px-4 py-2 mx-auto">
      <Image src="/squawk.svg" alt="SquawkAI Logo" width={26} height={26} priority />
    </div>
  </header>
);

// Miniature input composer
const MiniInputComposer: React.FC = () => {
  const [isFocused, setIsFocused] = React.useState(false);

  return (
    <div className="border-t bg-background/85 backdrop-blur">
      <div className="max-w-5xl mx-auto px-4 py-2">
        <div className={`flex items-center gap-2 border rounded-2xl bg-card px-2.5 py-2 transition-all duration-200 ${
          isFocused ? 'ring-2 ring-ring ring-offset-2 ring-offset-background' : ''
        }`}>
          <button
            type="button"
            className="shrink-0 inline-flex items-center justify-center rounded-full size-8 bg-white border border-black/[0.08]"
            title="Attach"
          >
            <Plus size={14} className="text-black/70" />
          </button>
          <input
            type="text"
            placeholder="Ask Anything"
            className="flex-1 min-h-[32px] text-sm border-none bg-transparent outline-none"
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
          <button className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
            <PaperPlaneTilt size={14} className="text-muted-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Main ChatPage Component
export const ChatPage: React.FC = () => {
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when component mounts
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, []);

  return (
    <div className="h-96 bg-background border border-border rounded-lg overflow-hidden flex flex-col">
      {/* Header */}
      <MiniHeader />

      {/* Chat messages area */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto">
        <div className="max-w-5xl w-full mx-auto px-4 py-3 space-y-3">
          {mockMessages.map((message, idx) => (
            <MiniMessage key={idx} role={message.role} content={message.content} />
          ))}
        </div>
      </div>

      {/* Input composer */}
      <MiniInputComposer />
    </div>
  );
};
