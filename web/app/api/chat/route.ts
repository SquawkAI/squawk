// app/api/chat/route.ts
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export async function POST(req: NextRequest) {
  const { messages = [] } = await req.json().catch(() => ({}));

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o", // Or "gpt-4o-mini"
      messages,
      stream: true,
    }),
  });

  if (!response.ok || !response.body) {
    return new Response("Failed to connect to OpenAI", { status: 500 });
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const stream = new ReadableStream({
    async start(controller) {
      const reader = response.body!.getReader();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });

          for (const line of chunk.split("\n")) {
            if (line.startsWith("data: ")) {
              const data = line.replace("data: ", "").trim();
              if (data === "[DONE]") {
                controller.close();
                return;
              }

              const json = JSON.parse(data);
              const content = json.choices?.[0]?.delta?.content;
              if (content) {
                controller.enqueue(encoder.encode(content));
              }
            }
          }
        }
        controller.close();
      } catch (err) {
        controller.enqueue(encoder.encode("Error: " + (err as Error).message));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
