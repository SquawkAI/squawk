"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { v4 as uuid } from "uuid";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Plus, PaperPlaneTilt } from "@phosphor-icons/react";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { prism } from "react-syntax-highlighter/dist/esm/styles/prism";

// ===== Helpers =====

function useAutoGrow(ref: React.RefObject<HTMLTextAreaElement | null>, value: string) {
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        el.style.height = "auto";
        el.style.height = Math.min(el.scrollHeight, 220) + "px";
    }, [value]);
}

function useMeasuredHeight(ref: React.RefObject<HTMLElement | null>, fallback = 64) {
    const [height, setHeight] = useState<number>(fallback);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const ro = new ResizeObserver(() => setHeight(el.getBoundingClientRect().height));
        ro.observe(el);
        setHeight(el.getBoundingClientRect().height);
        return () => ro.disconnect();
    }, []);
    return height;
}

function normalizeFences(s: string) {
    return s
        .replace(/([^\n])```(\w+)?/g, "$1\n```$2")
        .replace(/```(\w+)?[ \t]*([^\n])/g, "```$1\n$2")
        .replace(/([^\n])```\s*$/gm, "$1\n```");
}

function normalizeLang(raw: string) {
    const normalized = raw.toLowerCase().trim();

    if (normalized.startsWith("pytho")) return "python";
    if (normalized.startsWith("js")) return "javascript";
    if (normalized.startsWith("ts")) return "typescript";
    if (normalized.startsWith("c#") || normalized.startsWith("csharp")) return "csharp";

    const aliasMap: Record<string, string> = {
        sh: "bash",
        zsh: "bash",
        shell: "bash",
        html5: "html",
        yml: "yaml",
        md: "markdown",
        txt: "text",
    };

    return aliasMap[normalized] || normalized;
}

interface MessageProps {
    role: "user" | "assistant";
    content: string;
}

const Message: React.FC<MessageProps> = ({ role, content }) => {
    const isUser = role === "user";

    return (
        <div className={`flex items-start gap-3 ${isUser ? "justify-end" : ""}`}>
            <div className={`rounded-2xl px-4 py-2 text-sm leading-relaxed max-w-[75%] ${isUser ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                {isUser ? (
                    <div className="whitespace-pre-wrap">{content}</div>
                ) : (
                    <div className="prose max-w-none text-sm text-neutral-800 dark:text-neutral-200 prose-pre:p-0 prose-pre:m-0 prose-pre:rounded-xl prose-pre:overflow-x-auto">
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm, remarkBreaks]} // ← remove remarkBreaks to avoid odd line wrapping
                            components={{
                                // Do NOT override <pre>; let SyntaxHighlighter own the block wrapper.
                            code({ className, children, ...props }) {
                                    const m = /language-([\w+-]+)/i.exec(className || "");
                                    const lang = normalizeLang(m?.[1] || "");

                                    // Inline or no language → simple inline <code>
                                    if (!lang) {
                                        return (
                                            <code
                                                className="px-1.5 py-0.5 rounded bg-neutral-100 font-mono text-[0.9em]"
                                                {...props}
                                            >
                                                {children}
                                            </code>
                                        );
                                    }

                                    // Fenced block with language → Prism highlighter
                                    return (
                                        <SyntaxHighlighter
                                            language={lang}

                                            // @ts-expect-error Syntax highlighter style override
                                            style={prism as unknown as { [k: string]: React.CSSProperties }}
                                            PreTag="div"
                                            customStyle={{
                                                background: "#f8f8f8",
                                                color: "#2d2d2d",
                                                borderRadius: "0.75rem",
                                                padding: "1rem",
                                                margin: 0,
                                                overflowX: "auto",
                                                fontSize: "0.875rem",
                                                lineHeight: "1.5",
                                            }}
                                            {...props}
                                        >
                                            {String(children).replace(/\n$/, "")}
                                        </SyntaxHighlighter>
                                    );
                                },
                                p: ({ children }) => (
                                    <p className="whitespace-pre-wrap leading-relaxed">{children}</p>
                                ),
                                li: ({ children }) => <li className="whitespace-pre-wrap">{children}</li>,
                            }}
                        >
                            {normalizeFences(content)}
                        </ReactMarkdown>
                    </div>
                )}
            </div>
        </div>
    );
}

// ===== Main ChatPage =====

export default function ChatPage() {
    const { id: projectId } = useParams();
    const [sessionId, setSessionId] = useState(uuid());
    
    
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<{ role: "user" | "assistant", content: string }[]>([
        { role: "assistant", content: "Hi! Ask me anything about your course materials." },
    ]);

    const [isLoading, setIsLoading] = useState(false);

    const textAreaRef = useRef<HTMLTextAreaElement>(null);
    const headerRef = useRef<HTMLElement>(null);
    const composerRef = useRef<HTMLDivElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    const headerHeight = useMeasuredHeight(headerRef);
    const composerHeight = useMeasuredHeight(composerRef, 76);

    useAutoGrow(textAreaRef, input);
    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }, [messages]);

    const sendMessage = async () => {
        const text = input.trim();
        if (!text || isLoading) return;

        setMessages((prev) => [...prev, { role: "user", content: text }]);
        setInput("");
        setIsLoading(true);

        const assistantIndex = messages.length + 1;
        setMessages((prev) => [...prev, { role: "assistant", content: "", streaming: true }]);

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: sessionId, project_id: projectId, query: text }),
            });

            if (!res.body) throw new Error("No response body");

            const reader = res.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value, { stream: true });

                setMessages((prev) => {
                    const copy = [...prev];
                    const m = copy[assistantIndex];
                    if (m) copy[assistantIndex] = { ...m, content: m.content + chunk };
                    return copy;
                });
            }
        } catch (e: unknown) {
            setMessages((prev) => {
                const copy = [...prev];
                const m = copy[assistantIndex];
                if (m) copy[assistantIndex] = { ...m, content: (m.content || "") + `\n\nError: ${(e as Error)?.message || e}` };
                return copy;
            });
        } finally {
            setMessages((prev) => {
                const copy = [...prev];
                const m = copy[assistantIndex];
                if (m) copy[assistantIndex] = { ...m, };
                return copy;
            });
            setIsLoading(false);
        }
    };

    return (
        <div className="h-screen bg-background">
            {/* Header */}
            <header
                ref={headerRef}
                className="fixed top-0 left-0 right-0 z-30 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60"
            >
                <div className="flex items-center justify-between max-w-5xl px-6 py-3 mx-auto">
                    <Image src="/squawk-logo-large.png" alt="SquawkAI Logo" width={120} height={40} priority />
                </div>
            </header>

            {/* Scrollable chat area */}
            <div
                ref={scrollRef}
                className="fixed inset-x-0 overflow-y-auto"
                style={{ top: headerHeight, bottom: 0, paddingBottom: composerHeight + 16 }}
            >
                <div className="max-w-5xl w-full mx-auto px-6 py-4 space-y-4">
                    {messages.map((m, idx) => (
                        <Message key={idx} role={m.role} content={m.content} />
                    ))}

                </div>
            </div>

            {/* Input composer */}
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
                        <Button onClick={sendMessage} disabled={!input.trim() || isLoading} className="h-10 rounded-full">
                            <PaperPlaneTilt size={16} />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
