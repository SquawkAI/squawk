"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Bot, UserRound, Plus } from "lucide-react";

// ---- Auto-resize textarea ----
function useAutoGrow(ref: React.RefObject<HTMLTextAreaElement | null>, value: string) {
    useEffect(() => {
        const el = ref.current;
        if (!el) return; // exit early if ref is still null
        el.style.height = "auto";
        el.style.height = Math.min(el.scrollHeight, 220) + "px";
    }, [ref, value]);
}

// ---- Measure an element’s height (updates on resize/content changes) ----
function useMeasuredHeight(ref: React.RefObject<HTMLElement>, fallback = 64) {
    const [h, setH] = useState<number>(fallback);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const ro = new ResizeObserver(() => setH(el.getBoundingClientRect().height));
        ro.observe(el);
        setH(el.getBoundingClientRect().height); // initial
        return () => ro.disconnect();
    }, []);
    return h;
}

// ---- Message bubble ----
function Message({ role, content }: { role: "user" | "assistant"; content: string }) {
    const isUser = role === "user";
    return (
        <div className={`flex items-start gap-3 ${isUser ? "justify-end" : ""}`}>
            {/* {!isUser && (
                <Avatar className="size-8 mt-1">
                    <AvatarFallback className="bg-primary/10 text-primary">
                        <Bot size={16} />
                    </AvatarFallback>
                </Avatar>
            )} */}
            <div
                className={`rounded-2xl px-4 py-2 text-sm leading-relaxed max-w-[75%] whitespace-pre-wrap ${isUser ? "bg-primary text-primary-foreground" : "bg-muted"
                    }`}
            >
                {content}
            </div>
            {/* {isUser && (
                <Avatar className="size-8 mt-1">
                    <AvatarFallback className="bg-blue-600/10 text-blue-600">
                        <UserRound size={16} />
                    </AvatarFallback>
                </Avatar>
            )} */}
        </div>
    );
}

export default function ChatPage() {
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState([
        { role: "assistant", content: "Hi! Ask me anything about your course materials." },
    ]);

    const [isLoading, setIsLoading] = useState(false);

    const textAreaRef = useRef<HTMLTextAreaElement | null>(null);
    const headerRef = useRef<HTMLElement | null>(null);
    const composerRef = useRef<HTMLDivElement | null>(null);

    const headerHight = useMeasuredHeight(headerRef as React.RefObject<HTMLElement>, 56);
    const composerHeight = useMeasuredHeight(composerRef as React.RefObject<HTMLDivElement>, 76);

    useAutoGrow(textAreaRef, input);


    const sendMessage = () => {
        const text = input.trim();
        if (!text) return;
        setMessages((prev) => [...prev, { role: "user", content: text }]);
        setInput("");
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            setMessages((prev) => [...prev, { role: "assistant", content: "(Mock reply) This is a simulated response." }]);
        }, 600);
    };

    return (
        <div className="h-screen bg-background">
            {/* Fixed Header */}
            <header
                ref={headerRef as React.RefObject<HTMLElement>}
                className="fixed top-0 left-0 right-0 z-30 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60"
            >
                <div className="flex items-center justify-between max-w-5xl px-6 py-3 mx-auto">
                    <Image src="/squawk-logo-large.png" alt="SquawkAI Logo" width={120} height={40} priority />
                </div>
            </header>

            {/* Scroll area occupies space between header and (overlaid) composer.
          We pad the bottom by the *measured* composer height so content never hides behind it. */}
            <div
                className="fixed inset-x-0 overflow-y-auto"
                style={{
                    top: headerHight,            // start below header
                    bottom: 0,               // extend to bottom; padding keeps clear of composer
                    paddingBottom: composerHeight + 16, // 16px breathing room above composer
                }}
            >
                <div className="max-w-5xl w-full mx-auto px-6 py-4 space-y-4">
                    {messages.map((m, idx) => (
                        <Message key={idx} role={m.role as "user" | "assistant"} content={m.content} />
                    ))}
                    {isLoading && <Message role="assistant" content="Typing..." />}
                </div>
            </div>

            <div
                ref={composerRef}
                className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70"
            >
                <div className="max-w-5xl mx-auto px-6 pt-2 pb-[calc(8px+env(safe-area-inset-bottom))]">
                    <div className="flex items-center gap-2 border rounded-2xl bg-card px-2.5 py-2">
                        <button
                            type="button"
                            className="shrink-0 inline-flex items-center justify-center rounded-full size-9 bg-white border border-black/[0.08]"
                            title="Attach"
                        >
                            <Plus size={18} className="text-black/70" />
                        </button>
                        <Textarea
                            ref={textAreaRef}
                            placeholder="Ask Anything"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    sendMessage();
                                }
                            }}
                            className="flex-1 min-h-[40px] max-h-[220px] resize-none border-none shadow-none bg-transparent outline-none focus-visible:ring-0"
                        />
                        <Button onClick={sendMessage} disabled={!input.trim()} className="h-10 rounded-full">
                            <Send size={16} />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
