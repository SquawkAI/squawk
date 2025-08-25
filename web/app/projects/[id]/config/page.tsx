"use client";

import React, { useEffect } from "react";
import useSWR from "swr";
import axios from "axios";
import Link from "next/link";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useParams } from "next/navigation";
import { IProject } from "../../layout";

type Choice = { key: string; title: string; desc: string; icon?: string };

const ToneEnum = z.enum(["formal", "neutral", "informal"]);
const ComplexityEnum = z.enum(["introductory", "intermediate", "advanced"]);
const AuthorityEnum = z.enum(["supportive", "authoritative", "default"]);
const DetailEnum = z.enum(["direct", "default", "explanatory"]);

const configFormSchema = z.object({
  title: z
    .string()
    .min(1, "Project title cannot be empty")
    .max(20, "Project title must be less than 20 characters"),
  tone: ToneEnum,
  complexity: ComplexityEnum,
  authority: AuthorityEnum,
  detail: DetailEnum,
});
type ConfigForm = z.infer<typeof configFormSchema>;

const toneChoices: Choice[] = configFormSchema.shape.tone.options.map((key) => ({
  key,
  title: key[0].toUpperCase() + key.slice(1),
  desc:
    key === "formal"
      ? "Structured, precise, and professional. Good for academic, legal, or business contexts."
      : key === "neutral"
        ? "Clear and balanced; avoids emotional phrasing. Good for general communication."
        : "Relaxed and conversational; approachable and friendly.",
  icon: key === "formal" ? "📘" : key === "neutral" ? "⚖️" : "💬",
}));

const complexityChoices: Choice[] = configFormSchema.shape.complexity.options.map((key) => ({
  key,
  title: key === "introductory" ? "Introductory" : key[0].toUpperCase() + key.slice(1),
  desc:
    key === "introductory"
      ? "Simplifies ideas with minimal jargon. Best for beginners."
      : key === "intermediate"
        ? "Moderate detail with some technical terms."
        : "High detail; assumes strong subject knowledge.",
  icon: key === "introductory" ? "🌱" : key === "intermediate" ? "🧩" : "🧠",
}));

const detailChoices: Choice[] = configFormSchema.shape.detail.options.map((key) => ({
  key,
  title: key[0].toUpperCase() + key.slice(1),
  desc:
    key === "direct"
      ? "Short answers with minimal extra detail. Great for quick decisions."
      : key === "default"
        ? "Balanced detail with moderate explanation."
        : "Adds context, reasoning, and background.",
  icon: key === "direct" ? "⚡" : key === "default" ? "📄" : "🔎",
}));

const authorityChoices: Choice[] = configFormSchema.shape.authority.options.map((key) => ({
  key,
  title: key === "default" ? "Default" : key[0].toUpperCase() + key.slice(1),
  desc:
    key === "supportive"
      ? "Encouraging and positive; good for coaching or mentoring."
      : key === "default"
        ? "Neutral tone with balanced authority and warmth."
        : "Confident, directive, and prescriptive guidance.",
  icon: key === "supportive" ? "🤝" : key === "default" ? "🎛️" : "🛡️",
}));

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
      role="radio"
      aria-checked={selected}
      className={[
        "relative w-full text-left rounded-xl p-4 md:p-5 transition",
        "bg-white ring-1 ring-stone-200 hover:ring-stone-300",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
        selected ? "ring-2 ring-blue-500 shadow-sm bg-blue-50/40" : "",
      ].join(" ")}
    >
      <span
        className={[
          "absolute right-3 top-3 h-5 w-5 rounded-full text-[11px] font-bold",
          "flex items-center justify-center transition-opacity",
          selected ? "bg-blue-600 text-white opacity-100" : "bg-stone-200 text-stone-600 opacity-0 group-hover:opacity-60",
        ].join(" ")}
        aria-hidden="true"
      >
        ✓
      </span>

      <div className="flex items-start gap-3">
        {item.icon ? (
          <div className="h-9 w-9 flex items-center justify-center rounded-full bg-stone-100 text-lg">
            {item.icon}
          </div>
        ) : null}
        <div>
          <div className="text-sm font-semibold text-stone-900">{item.title}</div>
          <div className="mt-1 text-xs md:text-[13px] leading-5 text-stone-600">{item.desc}</div>
        </div>
      </div>
    </button>
  );
}

const ConfigPage: React.FC = () => {
  const { id: projectId } = useParams<{ id: string }>();

  const { data: project } = useSWR<IProject>(
    projectId ? `/api/projects/${projectId}` : null,
    async (url: string) => (await axios.get(url)).data
  );

  const {
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<ConfigForm>({
    resolver: zodResolver(configFormSchema),
    defaultValues: {
      title: "",
      tone: "neutral",
      complexity: "intermediate",
      detail: "default",
      authority: "default",
    },
  });

  useEffect(() => {
    if (!project) return;
    reset({
      title: project.title ?? "",
      tone: (project.tone as ConfigForm["tone"]) ?? "neutral",
      complexity: (project.complexity as ConfigForm["complexity"]) ?? "intermediate",
      detail: (project.detail as ConfigForm["detail"]) ?? "default",
      authority: (project.authority as ConfigForm["authority"]) ?? "default", // ✅ fixed (was "neutral")
    });
  }, [project, reset]);

  const tone = watch("tone");
  const complexity = watch("complexity");
  const detail = watch("detail");
  const authority = watch("authority");

  const onSubmit = (values: ConfigForm) => {
    alert(`Settings saved:\n${JSON.stringify(values, null, 2)}`);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-6 md:px-8 lg:px-10 pt-6">
        <header className="mt-4 flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-stone-900">Configure</h1>
            <p className="mt-1 text-stone-600">Update chat settings and tone</p>
          </div>
        </header>
      </div>

      <section className="mx-auto max-w-7xl px-6 md:px-8 lg:px-10 py-6 md:py-8">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Left */}
            <div className="flex flex-col gap-8">
              {/* Tone */}
              <div role="radiogroup" aria-label="Tone">
                <h2 className="text-lg font-semibold text-stone-900">Tone</h2>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {toneChoices.map((c) => (
                    <OptionCard
                      key={c.key}
                      item={c}
                      selected={tone === c.key}
                      onSelect={() => setValue("tone", c.key as ConfigForm["tone"], { shouldDirty: true })}
                    />
                  ))}
                </div>
                {errors.tone && <p className="mt-1 text-xs text-red-600">{errors.tone.message}</p>}
              </div>

              {/* Complexity */}
              <div role="radiogroup" aria-label="Complexity">
                <h2 className="text-lg font-semibold text-stone-900">Complexity</h2>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {complexityChoices.map((c) => (
                    <OptionCard
                      key={c.key}
                      item={c}
                      selected={complexity === c.key}
                      onSelect={() =>
                        setValue("complexity", c.key as ConfigForm["complexity"], { shouldDirty: true })
                      }
                    />
                  ))}
                </div>
                {errors.complexity && (
                  <p className="mt-1 text-xs text-red-600">{errors.complexity.message}</p>
                )}
              </div>

              {/* Detail */}
              <div role="radiogroup" aria-label="Style – Detail">
                <h2 className="text-lg font-semibold text-stone-900">Style – Detail</h2>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {detailChoices.map((c) => (
                    <OptionCard
                      key={c.key}
                      item={c}
                      selected={detail === c.key}
                      onSelect={() => setValue("detail", c.key as ConfigForm["detail"], { shouldDirty: true })}
                    />
                  ))}
                </div>
                {errors.detail && <p className="mt-1 text-xs text-red-600">{errors.detail.message}</p>}
              </div>

              {/* Authority */}
              <div role="radiogroup" aria-label="Style – Authority">
                <h2 className="text-lg font-semibold text-stone-900">Style – Authority</h2>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {authorityChoices.map((c) => (
                    <OptionCard
                      key={c.key}
                      item={c}
                      selected={authority === c.key}
                      onSelect={() =>
                        setValue("authority", c.key as ConfigForm["authority"], { shouldDirty: true })
                      }
                    />
                  ))}
                </div>
                {errors.authority && (
                  <p className="mt-1 text-xs text-red-600">{errors.authority.message}</p>
                )}
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
                <p className="text-sm leading-7 text-stone-700">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla non eleifend arcu, quis luctus sapien.
                  Mauris rutrum dui nec quam venenatis, sit amet accumsan ipsum gravida. Integer eu sagittis libero.
                </p>
                <p className="mt-4 text-sm leading-7 text-stone-700">
                  Etiam pretium augue sit amet tincidunt eleifend. Integer tincidunt, lacus id pharetra volutpat, est leo
                  faucibus turpis, ut vehicula justo nisi ut libero.
                </p>
              </div>
            </aside>
          </div>

          <div className="mt-8 flex items-center justify-end gap-3">
            <Link
              href="/projects"
              className="text-sm px-4 py-2 rounded-lg border border-stone-300 hover:bg-stone-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="text-sm px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
            >
              Save Settings
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};

export default ConfigPage;