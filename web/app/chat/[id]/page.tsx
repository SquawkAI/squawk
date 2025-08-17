"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Plus } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";

// ====== Helpers ======

function useAutoGrow(ref: React.RefObject<HTMLTextAreaElement | null>, value: string) {
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        el.style.height = "auto";
        el.style.height = Math.min(el.scrollHeight, 220) + "px";
    }, [ref, value]);
}

function useMeasuredHeight(ref: React.RefObject<HTMLElement>, fallback = 64) {
    const [h, setH] = useState<number>(fallback);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const ro = new ResizeObserver(() => setH(el.getBoundingClientRect().height));
        ro.observe(el);
        setH(el.getBoundingClientRect().height);
        return () => ro.disconnect();
    }, []);
    return h;
}

// Normalize fences that were split during streaming
function normalizeFences(s: string) {
    let out = s;
    out = out.replace(/([^\n])```(\w+)?/g, "$1\n```$2");
    out = out.replace(/```(\w+)?[ \t]*([^\n])/g, "```$1\n$2");
    out = out.replace(/([^\n])```\s*$/gm, "$1\n```");
    return out;
}

// ====== Message bubble (renders plain while streaming, Markdown after) ======

type Msg = { role: "user" | "assistant"; content: string; streaming?: boolean };

function Message({ role, content, streaming }: Msg) {
    const isUser = role === "user";

    return (
        <div className={`flex items-start gap-3 ${isUser ? "justify-end" : ""}`}>
            <div
                className={`rounded-2xl px-4 py-2 text-sm leading-relaxed max-w-[75%] ${isUser ? "bg-primary text-primary-foreground" : "bg-muted"
                    }`}
            >
                {isUser ? (
                    <div className="whitespace-pre-wrap">{content}</div>
                ) : streaming ? (
                    // live view: keep exactly what’s coming in
                    <pre className="whitespace-pre-wrap leading-relaxed">{content}</pre>
                ) : (
                    // final view: pretty markdown w/ code highlighting + preserved line breaks
                    <div className="prose prose-neutral max-w-none">
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm, remarkBreaks]}
                            components={{
                                p: ({ children }) => (
                                    <p className="whitespace-pre-wrap leading-relaxed">{children}</p>
                                ),
                                li: ({ children }) => <li className="whitespace-pre-wrap">{children}</li>,
                                pre: ({ children }) => (
                                    <pre className="whitespace-pre-wrap break-words rounded-xl bg-neutral-950 text-neutral-100 p-4 overflow-x-auto">
                                        {children}
                                    </pre>
                                ),
                                code({ inline, className, children, ...props }) {
                                    // react-markdown sets className like "language-python" when it sees ```python
                                    // But models may emit "``` py", "```Python", etc. We normalize here.
                                    const raw = className || "";
                                    const m = /language-([^\s]+)/i.exec(raw);
                                    let lang = (m?.[1] || "").toLowerCase().trim();

                                    console.log(lang);

                                    // Map common aliases → Prism languages
                                    const alias: Record<string, string> = {
                                        py: "python",
                                        python3: "python",
                                        js: "javascript",
                                        jsx: "jsx",
                                        ts: "typescript",
                                        tsx: "tsx",
                                        shell: "bash",
                                        sh: "bash",
                                        zsh: "bash",
                                        bash: "bash",
                                        csharp: "csharp",
                                        "c#": "csharp",
                                        html5: "html",
                                        yml: "yaml",
                                        md: "markdown",
                                        txt: "text",
                                    };
                                    lang = alias[lang] || lang;

                                    if (!inline && lang) {
                                        return (
                                            <SyntaxHighlighter
                                                language={lang}
                                                PreTag="div"
                                                customStyle={{
                                                    margin: 0,
                                                    borderRadius: "0.75rem",
                                                    padding: "1rem",
                                                    overflowX: "auto",
                                                }}
                                                {...props}
                                            >
                                                {String(children).replace(/\n$/, "")}
                                            </SyntaxHighlighter>
                                        );
                                    }

                                    // Inline code or no language → simple <code>
                                    return (
                                        <code
                                            className="px-1.5 py-0.5 rounded font-mono text-[0.9em]"
                                            {...props}
                                        >
                                            {children}
                                        </code>
                                    );
                                }
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

// ====== Page ======

const SESSION_ID = "session-1"; // or generate per tab
const PROJECT_ID = "3dd5aaf4-9d39-45ab-8cbb-c1e2f4977899"; // <- your project id

export default function ChatPage() {
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<Msg[]>([
        { role: "assistant", content: "Hi! Ask me anything about your course materials." },
    ]);
    const [isLoading, setIsLoading] = useState(false);

    const textAreaRef = useRef<HTMLTextAreaElement | null>(null);
    const headerRef = useRef<HTMLElement | null>(null);
    const composerRef = useRef<HTMLDivElement | null>(null);
    const scrollRef = useRef<HTMLDivElement | null>(null);

    const headerHight = useMeasuredHeight(headerRef as React.RefObject<HTMLElement>, 56);
    const composerHeight = useMeasuredHeight(composerRef as React.RefObject<HTMLDivElement>, 76);

    useAutoGrow(textAreaRef, input);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }, [messages]);

    const sendMessage = async () => {
        const text = input.trim();
        if (!text || isLoading) return;

        setMessages((prev) => [...prev, { role: "user", content: text }]);
        setInput("");
        setIsLoading(true);

        // Push an empty assistant message we'll append to
        const assistantIndex = messages.length + 1;
        setMessages((prev) => [...prev, { role: "assistant", content: "", streaming: true }]);

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: SESSION_ID,
                    project_id: PROJECT_ID,
                    query: text,
                }),
            });

            if (!res.body) throw new Error("No response body");

            const reader = res.body.getReader();
            const decoder = new TextDecoder();

            // Read the streamed bytes and append
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
        } catch (e: any) {
            setMessages((prev) => {
                const copy = [...prev];
                const m = copy[assistantIndex];
                if (m) copy[assistantIndex] = { ...m, content: (m.content || "") + `\n\nError: ${e?.message || e}`, streaming: false };
                return copy;
            });
        } finally {
            setMessages((prev) => {
                const copy = [...prev];
                const m = copy[assistantIndex];
                if (m) copy[assistantIndex] = { ...m, streaming: false };
                return copy;
            });
            setIsLoading(false);
        }
    };

    return (
        <div className="h-screen bg-background">
            {/* Header */}
            <header
                ref={headerRef as React.RefObject<HTMLElement>}
                className="fixed top-0 left-0 right-0 z-30 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60"
            >
                <div className="flex items-center justify-between max-w-5xl px-6 py-3 mx-auto">
                    <Image src="/squawk-logo-large.png" alt="SquawkAI Logo" width={120} height={40} priority />
                </div>
            </header>

            {/* Scroll area */}
            <div
                ref={scrollRef}
                className="fixed inset-x-0 overflow-y-auto"
                style={{
                    top: headerHight,
                    bottom: 0,
                    paddingBottom: composerHeight + 16,
                }}
            >
                <div className="max-w-5xl w-full mx-auto px-6 py-4 space-y-4">
                    {messages.map((m, idx) => (
                        <Message key={idx} role={m.role} content={m.content} streaming={m.streaming} />
                    ))}
                    {isLoading && !messages[messages.length - 1]?.streaming && (
                        <Message role="assistant" content="Typing..." />
                    )}
                </div>
            </div>

            {/* Composer */}
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
                            <Send size={16} />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
