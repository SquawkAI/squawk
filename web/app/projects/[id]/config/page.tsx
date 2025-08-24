"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";

type Choice = { key: string; title: string; desc: string; icon?: string };

const toneChoices: Choice[] = [
  { key: "formal", title: "Formal", desc: "Structured, precise, and professional. Good for academic, legal, or business contexts.", icon: "📘" },
  { key: "neutral", title: "Neutral", desc: "Clear and balanced; avoids emotional phrasing. Good for general communication.", icon: "⚖️" },
  { key: "informal", title: "Informal", desc: "Relaxed and conversational; approachable and friendly.", icon: "💬" },
];

const complexityChoices: Choice[] = [
  { key: "intro", title: "Introductory", desc: "Simplifies ideas with minimal jargon. Best for beginners.", icon: "🌱" },
  { key: "intermediate", title: "Intermediate", desc: "Moderate detail with some technical terms.", icon: "🧩" },
  { key: "advanced", title: "Advanced", desc: "High detail; assumes strong subject knowledge.", icon: "🧠" },
];

const detailChoices: Choice[] = [
  { key: "direct", title: "Direct", desc: "Short answers with minimal extra detail. Great for quick decisions.", icon: "⚡" },
  { key: "default", title: "Default", desc: "Balanced detail with moderate explanation.", icon: "📄" },
  { key: "explanatory", title: "Explanatory", desc: "Adds context, reasoning, and background.", icon: "🔎" },
];

const authorityChoices: Choice[] = [
  { key: "supportive", title: "Supportive", desc: "Encouraging and positive; good for coaching or mentoring.", icon: "🤝" },
  { key: "neutral", title: "Default", desc: "Neutral tone with balanced authority and warmth.", icon: "🎛️" },
  { key: "authoritative", title: "Authoritative", desc: "Confident, directive, and prescriptive guidance.", icon: "🛡️" },
];

function OptionCard({
  item,
  selected,
  onSelect,
}: {
  item: Choice;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        "w-full text-left rounded-xl p-4 md:p-5 transition",
        "bg-white ring-1 ring-stone-200 hover:ring-stone-300",
        selected ? "ring-2 ring-blue-500 shadow-sm bg-blue-50/40" : "",
      ].join(" ")}
    >
      <div className="flex items-start gap-3">
        {item.icon ? (
          <div className="h-9 w-9 flex items-center justify-center rounded-full bg-stone-100 text-lg">
            {item.icon}
          </div>
        ) : null}
        <div>
          <div className="text-sm font-semibold text-stone-900">{item.title}</div>
          <div className="mt-1 text-xs md:text-[13px] leading-5 text-stone-600">
            {item.desc}
          </div>
        </div>
      </div>
    </button>
  );
}

export default function ConfigPage() {
  const [tone, setTone] = useState("neutral");
  const [complexity, setComplexity] = useState("intermediate");
  const [detail, setDetail] = useState("default");
  const [authority, setAuthority] = useState("neutral");

  return (
    <div className="min-h-screen bg-white">
      {/* Top bar */}
      <div className="mx-auto max-w-7xl px-6 md:px-8 lg:px-10 pt-6">
        <Link
          href="/projects"
          className="inline-flex items-center gap-1 text-sm text-stone-700 hover:text-stone-900 transition-colors"
        >
          <ArrowLeft size={16} />
          Back
        </Link>
        <header className="mt-4 flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-stone-900">Configure</h1>
            <p className="mt-1 text-stone-600">Update chat settings and tone</p>
          </div>
        </header>
      </div>

      {/* Content */}
      <section className="mx-auto max-w-7xl px-6 md:px-8 lg:px-10 py-6 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Left: Controls */}
          <div className="flex flex-col gap-8">
            {/* Tone */}
            <div>
              <h2 className="text-lg font-semibold text-stone-900">Tone</h2>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {toneChoices.map((c) => (
                  <OptionCard
                    key={c.key}
                    item={c}
                    selected={tone === c.key}
                    onSelect={() => setTone(c.key)}
                  />
                ))}
              </div>
            </div>

            {/* Complexity */}
            <div>
              <h2 className="text-lg font-semibold text-stone-900">Complexity</h2>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {complexityChoices.map((c) => (
                  <OptionCard
                    key={c.key}
                    item={c}
                    selected={complexity === c.key}
                    onSelect={() => setComplexity(c.key)}
                  />
                ))}
              </div>
            </div>

            {/* Style – Detail */}
            <div>
              <h2 className="text-lg font-semibold text-stone-900">Style – Detail</h2>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {detailChoices.map((c) => (
                  <OptionCard
                    key={c.key}
                    item={c}
                    selected={detail === c.key}
                    onSelect={() => setDetail(c.key)}
                  />
                ))}
              </div>
            </div>

            {/* Style – Authority */}
            <div>
              <h2 className="text-lg font-semibold text-stone-900">Style – Authority</h2>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {authorityChoices.map((c) => (
                  <OptionCard
                    key={c.key}
                    item={c}
                    selected={authority === c.key}
                    onSelect={() => setAuthority(c.key)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Right: Preview */}
          <aside className="lg:sticky lg:top-6 h-fit">
            <div>
              <h2 className="text-lg font-semibold text-stone-900">Prompt Preview</h2>
              <div className="text-xs text-stone-500">
                Tone: <span className="font-medium">{tone}</span> · Complexity:{" "}
                <span className="font-medium">{complexity}</span> · Detail:{" "}
                <span className="font-medium">{detail}</span> · Authority:{" "}
                <span className="font-medium">{authority}</span>
              </div>
            </div>

            <div className="mt-3 rounded-xl bg-white ring-1 ring-stone-200 shadow-sm p-5">
              <div className="prose prose-stone max-w-none">
                <p className="text-sm leading-7 text-stone-700">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla non
                  eleifend arcu, quis luctus sapien. Aliquam venenatis dui ac bibendum
                  fermentum. Mauris rutrum dui nec quam venenatis, sit amet accumsan ipsum
                  gravida. Integer eu sagittis libero, sed interdum velit. Nam sodales
                  condimentum ligula eget aliquet. Vestibulum eleifend lacus et semper
                  fermentum. Duis vitae neque vel arcu gravida commodo sit amet a nisi.
                </p>
                <p className="mt-4 text-sm leading-7 text-stone-700">
                  Etiam pretium augue sit amet tincidunt eleifend. Donec rhoncus tortor id
                  lectus imperdiet feugiat. Integer tincidunt, lacus id pharetra volutpat,
                  est leo faucibus turpis, ut vehicula justo nisi ut libero.
                </p>
              </div>
            </div>
          </aside>
        </div>

        {/* Footer actions (optional) */}
        <div className="mt-8 flex items-center justify-end gap-3">
          <Link
            href="/projects"
            className="text-sm px-4 py-2 rounded-lg border border-stone-300 hover:bg-stone-50"
          >
            Cancel
          </Link>
          <button
            className="text-sm px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
            onClick={() => alert("Settings saved")}
          >
            Save Settings
          </button>
        </div>
      </section>
    </div>
  );
}
