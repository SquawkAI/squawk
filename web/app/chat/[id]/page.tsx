"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Send, Bot, UserRound } from "lucide-react";

// Chat message bubble
function Message({ role, content }: { role: "user" | "assistant"; content: string }) {
    const isUser = role === "user";

    return (
        <div className={`flex items-start gap-3 ${isUser ? "justify-end" : ""}`}>
            {!isUser && (
                <Avatar className="size-8 mt-1">
                    <AvatarFallback className="bg-primary/10 text-primary">
                        <Bot size={16} />
                    </AvatarFallback>
                </Avatar>
            )}
            <div
                className={`rounded-2xl px-4 py-2 text-sm leading-relaxed max-w-[75%] whitespace-pre-wrap ${isUser ? "bg-primary text-primary-foreground" : "bg-muted"
                    }`}
            >
                {content}
            </div>
            {isUser && (
                <Avatar className="size-8 mt-1">
                    <AvatarFallback className="bg-blue-600/10 text-blue-600">
                        <UserRound size={16} />
                    </AvatarFallback>
                </Avatar>
            )}
        </div>
    );
}

// Auto-resize textarea
function useAutoGrow(ref: React.RefObject<HTMLTextAreaElement>, value: string) {
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        el.style.height = "auto";
        el.style.height = Math.min(el.scrollHeight, 220) + "px";
    }, [value]);
}

export default function ChatPage() {
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState([
        { role: "assistant", content: "Hi! Ask me anything about your course materials." },
    ]);
    const [isThinking, setIsThinking] = useState(false);

    const suggestions = [
        "Summarize my lecture notes",
        "Generate a 5-question quiz",
        "Explain Fourier transform simply",
    ];

    const taRef = useRef<HTMLTextAreaElement | null>(null);
    const bottomRef = useRef<HTMLDivElement | null>(null);
    useAutoGrow(taRef, input);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isThinking]);

    const sendMessage = () => {
        const text = input.trim();
        if (!text) return;
        setMessages((prev) => [...prev, { role: "user", content: text }]);
        setInput("");
        setIsThinking(true);

        setTimeout(() => {
            setIsThinking(false);
            setMessages((prev) => [...prev, { role: "assistant", content: "(Mock reply) This is a simulated response." }]);
        }, 600);
    };

    return (
        <div className="min-h-screen w-screen bg-background flex flex-col">
            {/* Header */}
            <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="flex items-center justify-between max-w-5xl px-6 py-3 mx-auto">
                    <Image src="/squawk-logo-large.png" alt="SquawkAI Logo" width={120} height={40} priority />
                </div>
            </header>

            {/* Main layout */}
            <main className="flex-1 w-full max-w-5xl mx-auto flex flex-col px-6 py-4">
                {/* Suggestion chips */}
                <div className="flex flex-wrap gap-2 mb-4">
                    {suggestions.map((s) => (
                        <button
                            key={s}
                            onClick={() => setInput(s)}
                            className="text-xs rounded-full px-3 py-1.5 border border-blue-100 text-blue-700 bg-blue-50 hover:bg-blue-100 transition"
                        >
                            {s}
                        </button>
                    ))}
                </div>

                {/* Message area */}
                <div className="flex-1 overflow-y-auto space-y-4 pb-6">
                    {messages.map((m, idx) => (
                        <Message key={idx} role={m.role as "user" | "assistant"} content={m.content} />
                    ))}
                    {isThinking && <Message role="assistant" content="Typing..." />}
                    <div ref={bottomRef} />
                </div>

                <Separator />

                {/* Composer */}
                <div className="py-4">
                    <div className="flex items-end gap-2 border rounded-2xl bg-card px-3 py-2 backdrop-blur">
                        <Textarea
                            ref={taRef}
                            placeholder="Message Squawk Assistant…"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    sendMessage();
                                }
                            }}
                            className="flex-1 min-h-[44px] max-h-[220px] resize-none border-none shadow-none bg-transparent outline-none focus-visible:ring-0"
                        />
                        <Button onClick={sendMessage} disabled={!input.trim()} className="h-10">
                            <Send size={16} />
                        </Button>
                    </div>
                </div>
            </main>
        </div>
    );
}
