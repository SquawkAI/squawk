"use client";

import React, { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Copy, CheckCircle, CodeSimple } from "@phosphor-icons/react/dist/ssr";

const SharePage = () => {
  const { id: projectId } = useParams() as { id: string };
  const baseURL = process.env.NEXT_PUBLIC_BASE_URL;
  const shareUrl = useMemo(() => `${baseURL}/chat/${projectId}`, [baseURL, projectId]);

  // Slider-controlled dimensions (pixels)
  const [w, setW] = useState(600);
  const [h, setH] = useState(600);

  const embedCode = useMemo(
    () =>
      `<iframe src="${shareUrl}" style="border:none;width:${w}px;height:${h}px;border-radius:8px;" title="Squawk Chat"></iframe>`,
    [shareUrl, w, h]
  );

  const [copied, setCopied] = useState<string | null>(null);
  const onCopy = async (text: string, which: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
      setTimeout(() => setCopied(null), 1200);
    } catch {}
  };

  return (
    <div className="mx-auto max-w-7xl min-h-[100dvh] flex flex-col gap-4 px-4 sm:px-6 lg:px-8 py-4">
      {/* Header */}
      <header>
        <h1 className="text-3xl font-bold leading-tight">Share</h1>
      </header>

      <section className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Link + Embed controls */}
        <div className="flex flex-col gap-6">
          {/* Share link */}
          <div>
            <div className="text-lg font-semibold mb-2">Share Link</div>
            <div className="flex items-stretch gap-2">
              <input
                readOnly
                value={shareUrl}
                className="w-full rounded-md border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 outline-none focus:ring-2 focus:ring-stone-300"
              />
              <button
                type="button"
                onClick={() => onCopy(shareUrl, "link")}
                className="inline-flex items-center gap-1 rounded-md border border-stone-200 px-3 py-2 text-sm font-medium text-stone-800 hover:bg-stone-50 active:bg-stone-100"
                aria-label="Copy share link"
              >
                {copied === "link" ? (
                  <>
                    <CheckCircle size={18} /> Copied
                  </>
                ) : (
                  <>
                    <Copy size={18} /> Copy
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Embed code, then sliders underneath */}
          <div>
            <div className="text-lg font-semibold mb-2">Embed Code</div>

            {/* Code box + copy */}
            <div className="flex items-stretch gap-2">
              <textarea
                readOnly
                value={embedCode}
                rows={3}
                className="w-full rounded-md border border-stone-200 bg-white px-3 py-2 text-xs text-stone-800 outline-none focus:ring-2 focus:ring-stone-300 font-mono"
              />
              <button
                type="button"
                onClick={() => onCopy(embedCode, "embed")}
                className="inline-flex items-center gap-1 rounded-md border border-stone-200 px-3 py-2 text-sm font-medium text-stone-800 hover:bg-stone-50 active:bg-stone-100"
                aria-label="Copy embed code"
              >
                {copied === "embed" ? (
                  <>
                    <CheckCircle size={18} /> Copied
                  </>
                ) : (
                  <>
                    <CodeSimple size={18} /> Copy
                  </>
                )}
              </button>
            </div>

            {/* Sliders UNDER the embed textarea */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
              <div>
                <label className="flex justify-between text-xs text-stone-600 mb-1">
                  <span>Width</span>
                  <span>{w}px</span>
                </label>
                <input
                  type="range"
                  min={320}
                  max={1200}
                  step={10}
                  value={w}
                  onChange={(e) => setW(parseInt(e.target.value))}
                  className="w-full"
                  aria-label="Embed width"
                />
              </div>
              <div>
                <label className="flex justify-between text-xs text-stone-600 mb-1">
                  <span>Height</span>
                  <span>{h}px</span>
                </label>
                <input
                  type="range"
                  min={320}
                  max={1400}
                  step={10}
                  value={h}
                  onChange={(e) => setH(parseInt(e.target.value))}
                  className="w-full"
                  aria-label="Embed height"
                />
              </div>
            </div>

            <p className="mt-2 text-xs text-stone-500">
              Paste this snippet into your site. The sliders below change the
              <code className="mx-1 rounded bg-stone-100 px-1">width</code> and
              <code className="mx-1 rounded bg-stone-100 px-1">height</code> in
              pixels and the preview updates live.
            </p>
          </div>
        </div>

        {/* Live preview iframe with border */}
        <div className="flex flex-col min-h-0">
          <div className="text-lg font-semibold mb-2">Chat Preview</div>
          <iframe
            src={shareUrl}
            title="Squawk Chat Preview"
            style={{ width: `${w}px`, height: `${h}px` }}
            className="rounded-md border border-stone-200 shadow-sm"
          />
        </div>
      </section>
    </div>
  );
};

export default SharePage;
