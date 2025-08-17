// Client component
"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";

export default function Chat() {
    const [live, setLive] = useState("");     // live/plain
    const [finalMd, setFinalMd] = useState(""); // full markdown after done
    const [done, setDone] = useState(false);

    const run = async () => {
        setLive(""); setFinalMd(""); setDone(false);

        const res = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                id: "session-1",
                project_id: "3dd5aaf4-9d39-45ab-8cbb-c1e2f4977899",
                query: "Explain string formatting",
            }),
        });

        const reader = res.body!.getReader();
        const dec = new TextDecoder();
        let buf = "";

        while (true) {
            const { done } = await reader.read().then(({ done, value }) => {
                if (done) return { done };
                const t = dec.decode(value, { stream: true });
                buf += t;
                setLive(prev => prev + t);   // show raw text live
                return { done: false };
            });
            if (done) break;
        }

        setDone(true);
        setFinalMd(buf); // render markdown only once, complete
    };

    return (
        <div className="p-6">
            <button onClick={run} className="rounded px-3 py-2 bg-black text-white">Stream</button>

            {!done ? (
                // live view preserves whitespace; no markdown yet
                <pre className="mt-4 whitespace-pre-wrap leading-relaxed">{live}</pre>
            ) : (
                // final view: real markdown (fences render correctly)
                <div className="prose max-w-none mt-4">
                    <ReactMarkdown>{finalMd}</ReactMarkdown>
                </div>
            )}
        </div>
    );
}
