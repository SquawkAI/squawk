"use client";

import React, { useState } from "react";
import { Copy, CodeSimple } from "@phosphor-icons/react";

// Mock share data for demonstration
const mockShareUrl = "https://squawk.ai/chat/demo-project-123";

// Miniature Share Link Section
const MiniShareLink: React.FC = () => (
  <div className="space-y-2">
    <div className="text-sm font-semibold text-foreground">Share Link</div>
    <div className="flex items-stretch gap-2">
      <input
        readOnly
        value={mockShareUrl}
        className="flex-1 rounded-md border border-border bg-background px-2 py-1.5 text-xs text-foreground outline-none"
      />
      <button
        type="button"
        className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
        aria-label="Copy share link"
      >
        <Copy size={14} />
        <span className="hidden sm:inline">Copy</span>
      </button>
    </div>
  </div>
);

// Miniature Embed Code Section
const MiniEmbedCode: React.FC<{ width: number; height: number }> = ({ width, height }) => {
  const embedCode = `<iframe src="${mockShareUrl}" style="border:none;width:${width}px;height:${height}px;border-radius:8px;" title="Squawk Chat"></iframe>`;

  return (
    <div className="space-y-2">
      <div className="text-sm font-semibold text-foreground">Embed Code</div>
      <div className="flex items-stretch gap-2">
        <textarea
          readOnly
          value={embedCode}
          className="flex-1 rounded-md border border-border bg-background px-2 py-1.5 text-xs text-foreground outline-none font-mono resize-none h-22 overflow-hidden"
          
        />
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
          aria-label="Copy embed code"
        >
          <CodeSimple size={14} />
          <span className="hidden sm:inline">Copy</span>
        </button>
      </div>
    </div>
  );
};

// Miniature Sliders Section
const MiniSliders: React.FC<{
  width: number;
  height: number;
  onWidthChange: (width: number) => void;
  onHeightChange: (height: number) => void;
}> = ({ width, height, onWidthChange, onHeightChange }) => (
  <div className="grid grid-cols-2 gap-3">
    <div>
      <label className="flex justify-between text-xs text-muted-foreground mb-1">
        <span>Width</span>
        <span>{width}px</span>
      </label>
      <input
        type="range"
        min={320}
        max={800}
        step={10}
        value={width}
        onChange={(e) => onWidthChange(parseInt(e.target.value))}
        className="w-full h-1 bg-muted rounded-lg appearance-none cursor-pointer slider"
        aria-label="Embed width"
      />
    </div>
    <div>
      <label className="flex justify-between text-xs text-muted-foreground mb-1">
        <span>Height</span>
        <span>{height}px</span>
      </label>
      <input
        type="range"
        min={320}
        max={800}
        step={10}
        value={height}
        onChange={(e) => onHeightChange(parseInt(e.target.value))}
        className="w-full h-1 bg-muted rounded-lg appearance-none cursor-pointer slider"
        aria-label="Embed height"
      />
    </div>
  </div>
);

// Main SharePage Component
export const SharePage: React.FC = () => {
  const [width, setWidth] = useState(400);
  const [height, setHeight] = useState(400);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4 p-4 bg-background border border-border rounded-lg">
      <div className="text-left">
        <h3 className="text-lg font-semibold text-foreground mb-1">Share Your Chat</h3>
        <p className="text-xs text-muted-foreground">
          Share your AI assistant with students or embed it on your website
        </p>
      </div>

      {/* Share Link */}
      <MiniShareLink />

      {/* Embed Code */}
      <MiniEmbedCode width={width} height={height} />

      {/* Sliders */}
      <MiniSliders
        width={width}
        height={height}
        onWidthChange={setWidth}
        onHeightChange={setHeight}
      />

      {/* Preview hint */}
      <div className="text-xs text-muted-foreground text-center bg-muted/50 rounded p-2">
        Use the sliders above to adjust the embed size
      </div>
    </div>
  );
};
