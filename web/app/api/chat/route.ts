// app/api/chat/route.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const CHAT_SERVICE = process.env.CHAT_SERVICE_URL

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await req.json().catch(() => ({}));

  const upstream = await fetch(CHAT_SERVICE!, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
    body: JSON.stringify(payload),
  });

  if (!upstream.ok || !upstream.body) {
    return new Response("Something went wrong", { status: 502 });
  }

  const decoder = new TextDecoder();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const reader = upstream.body!.getReader();

      let buf = "";                 // chunk buffer
      let dataLines: string[] = []; // collects `data:` lines for one event

      const flushEvent = () => {
        const joined = dataLines.join("\n"); // SSE spec: join with LF
        dataLines = [];
        // handle completion marker
        if (joined.trim().toLowerCase() === "[done]") {
          controller.close();
          return true;
        }
        controller.enqueue(encoder.encode(joined));
        return false;
      };

      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buf += decoder.decode(value, { stream: true });

          // Process per line
          let idx: number;
          while ((idx = buf.indexOf("\n")) !== -1) {
            const line = buf.slice(0, idx).replace(/\r$/, ""); // strip CR if any
            buf = buf.slice(idx + 1);

            if (line === "") {
              // blank line => end of event
              if (dataLines.length) {
                if (flushEvent()) return;
              }
              continue;
            }

            if (line.startsWith(":")) {
              // comment/heartbeat -> ignore
              continue;
            }

            if (line.startsWith("data:")) {
              // remove exactly one field-space if present
              const value = line.startsWith("data: ") ? line.slice(6) : line.slice(5);
              dataLines.push(value);
              continue;
            }

            // Ignore other SSE fields for this use-case (id, event, retry)
          }
        }

        // flush any trailing event if the stream ends without a final blank line
        if (dataLines.length) flushEvent();

        controller.close();
      } catch (err: unknown) {
        controller.enqueue(encoder.encode("Error: " + ((err as Error)?.message || String(err))));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
